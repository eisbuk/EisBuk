/* eslint-disable no-case-declarations */
import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { v4 as uuid } from "uuid";

import {
  BookingSubCollection,
  Collection,
  CustomerAttendance,
  CustomerBookingEntry,
  OrgSubCollection,
  SlotAttendnace,
  SlotInterface,
  SlotInterval,
  sanitizeCustomer,
  OrganizationData,
  Customer,
} from "@eisbuk/shared";

import { __functionsZone__ } from "./constants";

/**
 * A type alias for Customer with `secretKey` and `id` optional
 */
type CustomerWithOptionalIDs = Omit<Customer, "id" | "secretKey"> &
  Partial<{ secretKey: string; id: string }>;

/**
 * Adds server generated `id` and a `secretKey` to a customer on create.
 * Updates a copy of a subset of customer's data in customer's bookings doc, accessible by
 * anonymous users who have access to `secretKey`.
 */
export const addIdAndSecretKey = functions
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Customers}/{customerId}`
  )
  .onWrite(async (change, context) => {
    const db = admin.firestore();
    const batch = db.batch();

    // this trigger should run only on create
    const isCreate = change.after.exists && !change.before.exists;
    const isDelete = !change.after.exists;

    // exit early on delete
    if (isDelete) {
      return;
    }

    const { organization, customerId } = context.params as Record<
      string,
      string
    >;
    const customerData = change.after.data() as CustomerWithOptionalIDs;
    const secretKey = customerData.secretKey || uuid();

    const orgRef = db.collection(Collection.Organizations).doc(organization);

    // update customer entry with `id` and `secretKey` only on create
    if (isCreate) {
      batch.set(
        orgRef.collection(OrgSubCollection.Customers).doc(customerId),
        {
          id: customerId,
          secretKey,
        } as Pick<Customer, "id" | "secretKey">,
        { merge: true }
      );
    }

    // when customer is updated through customerSelfUpdate cloud fn
    const customer = sanitizeCustomer({
      ...customerData,
      id: customerId,
    } as Customer);

    // create/update booking entry
    batch.set(
      orgRef.collection(OrgSubCollection.Bookings).doc(secretKey),
      customer
    );

    await batch.commit();
  });

/**
 * Data trigger listening to create/delete slot document and creates/deletes attendance entry for given slot.
 * Doesn't run if slot is only updated.
 */
export const triggerAttendanceEntryForSlot = functions
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Slots}/{slotId}`
  )
  .onWrite(async (change, context) => {
    const db = admin.firestore();

    const { organization, slotId } = context.params as Record<string, string>;

    const isCreate = !change.before.exists;
    const isDelete = !change.after.exists;

    const attendanceEntryRef = db
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.Attendance)
      .doc(slotId);

    switch (true) {
      case isCreate:
        // check if attendance entry already exists (in case we're dumping/restoring the data)
        const { exists } = await attendanceEntryRef.get();
        if (exists) {
          return;
        }
        // add empty entry for slot's attendance
        await attendanceEntryRef.set({
          date: change.after.data()!.date,
          attendances: {},
        } as SlotAttendnace);
        break;
      case isDelete:
        // delete attendance entry for slot
        await attendanceEntryRef.delete();
        break;
      default:
        // exit if slot was just updated
        return;
    }
  });

/**
 * Maintain a copy of each slot in a different structure aggregated by month.
 * This allows to update small documents while still being able to get data for
 * a whole month in a single read.
 * The cost is one extra write per each update to the slots.
 */
export const aggregateSlots = functions
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Slots}/{slotId}`
  )
  .onWrite(async (change, context) => {
    const { organization, slotId: id } = context.params as Record<
      string,
      string
    >;

    const db = admin.firestore();

    let date: string;
    let newSlot: SlotInterface | FirebaseFirestore.FieldValue;

    const isCreate = !change.before.exists;
    const isDelete = !change.after.exists;

    const deleteSentinel = admin.firestore.FieldValue.delete();

    switch (true) {
      case isDelete:
        // if deleting, we're just setting slot value as delete sentinel and getting the date from before
        const beforeData = change.before.data() as SlotInterface;
        date = beforeData.date;
        newSlot = deleteSentinel;
        break;
      case isCreate:
        // if creating, we're only using the new (after data) and adding generated id
        const afterData = change.after.data()! as Omit<SlotInterface, "id">;
        newSlot = { ...afterData, id };
        date = newSlot.date;
        break;
      default:
        // if not change or create: is update
        const { intervals: newIntervals, ...updatedData } =
          change.after.data() as Omit<SlotInterface, "id">;
        const { intervals: oldIntervals } = change.before.data() as Omit<
          SlotInterface,
          "id"
        >;

        // we're using {merge: true} flag for setting the document so
        // we need to process intervals in order to make sure the old intervals get deleted
        // and only the updated values remain (prevent merging of the old values with the new)
        const deletedIntervals = Object.keys(oldIntervals).reduce(
          (acc, intervalString) => ({
            ...acc,
            [intervalString]: deleteSentinel,
          }),
          {} as Record<string, typeof deleteSentinel>
        );
        const updatedIntervals = Object.keys(newIntervals).reduce(
          (acc, intervalString) => ({
            ...acc,
            [intervalString]: newIntervals[intervalString],
          }),
          {} as Record<string, SlotInterval>
        );

        // we're merging old intervals as delete sentinels and new intervals as they are
        // this way old intervals get deleted and in case some interval should stay (wasn't changed/deleted),
        // the delete sentinel gets overwritten with the new value
        const intervals = {
          ...deletedIntervals,
          ...updatedIntervals,
        } as Record<string, SlotInterval>;

        newSlot = { ...updatedData, intervals, id };
        date = newSlot.date;
    }

    const monthStr = date.substring(0, 7);

    const monthSlotsRef = db
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.SlotsByDay)
      .doc(monthStr);

    await monthSlotsRef.set({ [date]: { [id]: newSlot } }, { merge: true });

    return change.after;
  });

/**
 * Data trigger used to update attendance entries for slot whenever customer books a certain slot + interval.
 *
 * - listens to `organizations/{organization}/bookings/{secretKey}/bookedSlots/{slotId}`
 * - writes to `organizations/{organization}/attendnace/{slotId}` - updates entry for `attendances[customerId]` leaving the rest of the doc unchanged
 */
export const createAttendanceForBooking = functions
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Bookings}/{secretKey}/${BookingSubCollection.BookedSlots}/{bookingId}`
  )
  .onWrite(async (change, context) => {
    const { organization, secretKey, bookingId } = context.params as Record<
      string,
      string
    >;

    const db = admin.firestore();

    const isUpdate = Boolean(change.after.exists);

    const { id: customerId } = (
      await db
        .collection(Collection.Organizations)
        .doc(organization)
        .collection(OrgSubCollection.Bookings)
        .doc(secretKey)
        .get()
    ).data() as Customer;

    const afterData = change.after.data() as CustomerBookingEntry | undefined;

    const updatedEntry = {
      attendances: {
        [customerId]: isUpdate
          ? ({
              bookedInterval: afterData!.interval,
              attendedInterval: afterData!.interval,
            } as CustomerAttendance)
          : admin.firestore.FieldValue.delete(),
      },
    };

    const attendanceRef = db
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.Attendance)
      .doc(bookingId);

    await attendanceRef.set(updatedEntry, { merge: true });
  });

/**
 * A data trigger used to store `existingSecrets` in organization document,
 * enabling us to verify existance of secrets in document available to client ("organizations/{organization}")
 * without storing actual values of secrets, stored in protected document ("secrets/{organization}")
 *
 * @example
 * Creating an `smsAuthToken` and `smtpAuthToken` will create entries in `secrets/test-organization`,
 * after which the trigger will run and register those secrets in `organizations/test-organization` as such:
 * ```
 * {
 *   ...organizationData,
 *   existingSecrets: ["authToken", "exampleSecret"]
 *  }
 * ```
 */
export const registerCreatedOrgSecret = functions
  .region(__functionsZone__)
  .firestore.document(`${Collection.Secrets}/{organization}`)
  .onWrite(async ({ after }, context) => {
    // if `after.data()` doesn't exist (the doc was deleted)
    // fall back to empty record
    // this shouldn't happen in production
    const data = after.data() || {};

    const { organization } = context.params as {
      organization: string;
    };

    const organizationRef = admin
      .firestore()
      .collection(Collection.Organizations)
      .doc(organization);

    // update (or create) list with new keys
    // if deleted (shouldn't happen) the fallback: `Object.keys({})`
    // will be an empty array which is fine
    const updatedSecrets = Object.keys(data!);
    const smtpConfig = ["smtpHost", "smtpPort", "smtpUser", "smtpPass"];

    const smtpConfigured = smtpConfig.every((element) =>
      updatedSecrets.includes(element)
    );
    await organizationRef.set(
      { existingSecrets: updatedSecrets, smtpConfigured },
      { merge: true }
    );
  });

export const createPublicOrgInfo = functions
  .region(__functionsZone__)
  .firestore.document(`${Collection.Organizations}/{organization}`)
  .onWrite(async (change, context) => {
    const { organization } = context.params;

    const db = admin.firestore();

    const isDelete = !change.after.exists;

    const publicOrgInfoDocRef = db
      .collection(Collection.PublicOrgInfo)
      .doc(organization);
    const orgData = change.after.data() as OrganizationData;

    if (isDelete) {
      await publicOrgInfoDocRef.delete();
      return;
    }
    const updates = [
      "displayName",
      "location",
      "emailFrom",
      "defaultCountryCode",
    ].reduce(
      (acc, curr) => (orgData[curr] ? { ...acc, [curr]: orgData[curr] } : acc),
      {}
    );
    await publicOrgInfoDocRef.set(updates, { merge: true });
  });

export const createAttendedSlotOnAttendance = functions
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Attendance}/{slotId}`
  )
  .onWrite(async (change, context) => {
    const { organization, slotId } = context.params as Record<string, string>;

    const db = admin.firestore();

    const currentAttendanceData = change.after.data() as SlotAttendnace;
    const previousAttendanceData = change.before.data() as SlotAttendnace;

    const hasCurrentAttendances =
      change.after.exists &&
      Object.keys(currentAttendanceData.attendances).length;
    const hasPreviousAttendances =
      change.before.exists &&
      Object.keys(previousAttendanceData.attendances).length;

    const currentAttendances = hasCurrentAttendances
      ? currentAttendanceData.attendances
      : {};
    const previousAttendances = hasPreviousAttendances
      ? previousAttendanceData.attendances
      : {};

    const ids = [
      ...new Set([
        ...Object.keys(currentAttendances),
        ...Object.keys(previousAttendances),
      ]),
    ];

    const idsMap = ids.map((id) => {
      const hasPreviousBooking =
        previousAttendances[id] && previousAttendances[id].bookedInterval;
      const isBooking =
        currentAttendances[id] && currentAttendances[id].bookedInterval;

      if (hasPreviousBooking || isBooking) return { [id]: "noUpdate" };

      return currentAttendanceData.attendances[id]
        ? previousAttendanceData.attendances[id]
          ? currentAttendances[id].attendedInterval ===
            previousAttendances[id].attendedInterval
            ? { [id]: "noUpdate" }
            : { [id]: "update" }
          : { [id]: "update" }
        : { [id]: "delete" };
    });

    const updates = idsMap.map(
      (customer) =>
        // eslint-disable-next-line no-async-promise-executor, consistent-return
        new Promise<FirebaseFirestore.WriteResult | void>(async (resolve) => {
          const customerId = Object.keys(customer)[0];
          const value = Object.values(customer)[0];

          if (value === "noUpdate") return resolve();

          const { secretKey } = (
            await db
              .collection(Collection.Organizations)
              .doc(organization)
              .collection(OrgSubCollection.Customers)
              .doc(customerId)
              .get()
          ).data() as Customer;

          const attendedSlotsEntryRef = db
            .collection(Collection.Organizations)
            .doc(organization)
            .collection(OrgSubCollection.Bookings)
            .doc(secretKey)
            .collection(BookingSubCollection.AttendedSlots)
            .doc(slotId);

          value === "update"
            ? resolve(
                await attendedSlotsEntryRef.set(
                  {
                    date: currentAttendanceData.date,
                    interval:
                      currentAttendanceData.attendances[customerId]
                        .attendedInterval,
                  },
                  { merge: true }
                )
              )
            : resolve(await attendedSlotsEntryRef.delete());
        })
    );
    await Promise.all(updates);
  });
