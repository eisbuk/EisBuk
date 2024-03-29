/* eslint-disable no-case-declarations */
import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { v4 as uuid } from "uuid";

import {
  wrapFirestoreOnCreateHandler,
  wrapFirestoreOnWriteHandler,
} from "./sentry-serverless-firebase";
import { __functionsZone__ } from "./constants";
import {
  BookingSubCollection,
  Collection,
  CustomerBookingEntry,
  OrgSubCollection,
  SlotAttendnace,
  SlotInterface,
  SlotInterval,
  sanitizeCustomer,
  OrganizationData,
  Customer,
  CustomerBookings,
  SlotsByDay,
  SlotBookingsCounts,
} from "@eisbuk/shared";

import { getCustomerStats } from "./utils";

/**
 * A type alias for Customer with `secretKey` and `id` optional
 */
type CustomerWithOptionalIDs = Omit<Customer, "id" | "secretKey"> &
  Partial<{ secretKey: string; id: string }>;

export const addIdToSlot = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Slots}/{slotId}`
  )
  .onCreate(
    wrapFirestoreOnCreateHandler("addIdToSlot", async ({ ref }, context) => {
      const { slotId } = context.params as Record<string, string>;
      ref.update({ id: slotId });
    })
  );

/**
 * Adds server generated `id` and a `secretKey` to a customer on create.
 * Updates a copy of a subset of customer's data in customer's bookings doc, accessible by
 * anonymous users who have access to `secretKey`.
 */
export const addCustomerIdAndSecretKey = functions
  .runWith({
    memory: "512MB",
  })
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Customers}/{customerId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "addCustomerIdAndSecretKey",
      async (change, context) => {
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

        const orgRef = db
          .collection(Collection.Organizations)
          .doc(organization);

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
      }
    )
  );

/**
 * Data trigger listening to create/delete slot document and creates/deletes attendance entry for given slot.
 * Doesn't run if slot is only updated.
 */
export const triggerAttendanceEntryForSlot = functions
  .runWith({
    memory: "512MB",
  })
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Slots}/{slotId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "triggerAttendanceEntryForSlot",
      async (change, context) => {
        const db = admin.firestore();

        const { organization, slotId } = context.params as Record<
          string,
          string
        >;

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
      }
    )
  );

/**
 * Maintain a copy of each slot in a different structure aggregated by month.
 * This allows to update small documents while still being able to get data for
 * a whole month in a single read.
 * The cost is one extra write per each update to the slots.
 */
export const aggregateSlots = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Slots}/{slotId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler("aggregateSlots", async (change, context) => {
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
    })
  );

export const countSlotsBookings = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Bookings}/{secretKey}/${BookingSubCollection.BookedSlots}/{bookingId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "countSlotsBookings",
      async (change, context) => {
        const { organization, bookingId } = context.params as Record<
          string,
          string
        >;

        // If the booking was merely updated, we don't need to do increment/decrement the counter
        if (change.before.exists && change.after.exists) {
          return;
        }

        const db = admin.firestore();

        const date = change.before.data()?.date || change.after.data()!.date;
        const delta = change.after.exists ? 1 : -1;

        const bookingCountsDocRef = db
          .collection(Collection.Organizations)
          .doc(organization)
          .collection(OrgSubCollection.SlotBookingsCounts)
          .doc(date.substring(0, 7));

        const doc = await bookingCountsDocRef.get();
        const data = doc.data() || ({} as SlotBookingsCounts);

        const slotsBookings = data[bookingId] || 0;
        data[bookingId] = slotsBookings + delta;

        await bookingCountsDocRef.set(data, { merge: true });
      }
    )
  );

/**
 * Data trigger used to update attendance entries for slot whenever customer books a certain slot + interval.
 *
 * - listens to `organizations/{organization}/bookings/{secretKey}/bookedSlots/{slotId}`
 * - writes to `organizations/{organization}/attendnace/{slotId}` - updates entry for `attendances[customerId]` leaving the rest of the doc unchanged
 */
export const createAttendanceForBooking = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Bookings}/{secretKey}/${BookingSubCollection.BookedSlots}/{bookingId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "createAttendanceForBooking",
      async (change, context) => {
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

        const afterData = change.after.data() as
          | CustomerBookingEntry
          | undefined;

        const updatedEntry = {
          attendances: {
            [customerId]: isUpdate
              ? afterData && afterData?.bookingNotes
                ? {
                    bookedInterval: afterData!.interval,
                    attendedInterval: afterData!.interval,
                    bookingNotes: afterData!.bookingNotes,
                  }
                : {
                    bookedInterval: afterData!.interval,
                    attendedInterval: afterData!.interval,
                  }
              : admin.firestore.FieldValue.delete(),
          },
        };

        const attendanceRef = db
          .collection(Collection.Organizations)
          .doc(organization)
          .collection(OrgSubCollection.Attendance)
          .doc(bookingId);

        await attendanceRef.set(updatedEntry, {
          mergeFields: [`attendances.${customerId}`],
        });
      }
    )
  );

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
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .firestore.document(`${Collection.Secrets}/{organization}`)
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "registerCreatedOrgSecret",
      async ({ after }, context) => {
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
      }
    )
  );

export const createPublicOrgInfo = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .firestore.document(`${Collection.Organizations}/{organization}`)
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "createPublicOrgInfo",
      async (change, context) => {
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
          "privacyPolicy",
        ].reduce(
          (acc, curr) =>
            orgData[curr] ? { ...acc, [curr]: orgData[curr] } : acc,
          {}
        );
        await publicOrgInfoDocRef.set(updates, { merge: true });
      }
    )
  );

/**
 * A data trigger used to create entries for `attendedSlots` in each respective customer's bookings, to make it
 * available for the client to see (in their calendar) that they have been marked present for a certain slot.
 *
 * Note: We're only creating attended slot entries for customers who haven't booked the same slot
 * (as the booking is displayed in their calendar in that case)
 */
export const createAttendedSlotOnAttendance = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Attendance}/{slotId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "createAttendedSlotOnAttendance",
      async (change, context) => {
        const { organization, slotId } = context.params as Record<
          string,
          string
        >;

        const db = admin.firestore();

        const currentAttendanceData = (change.after.data() ||
          {}) as SlotAttendnace;
        const previousAttendanceData = (change.before.data() ||
          {}) as SlotAttendnace;

        const currentAttendances = currentAttendanceData?.attendances || {};
        const previousAttendances = previousAttendanceData?.attendances || {};

        const ids = [
          ...new Set([
            ...Object.keys(currentAttendances),
            ...Object.keys(previousAttendances),
          ]),
        ];

        const updates = ids.map((id) => {
          const previousAttendance = previousAttendances[id];
          const currentAttendance = currentAttendances[id];

          const hasBooked =
            previousAttendance?.bookedInterval ||
            currentAttendance?.bookedInterval;

          const interval = currentAttendance?.attendedInterval || null;

          return {
            customerId: id,
            // If updating the interval (in the next step), we're updating with respect to the currently attended interval
            interval,
            // We don't update if customer has bookings (in that case, no attended interval is ever created)
            // or if attended interval from previous attendance is the same as the current one.
            //
            // For all other cases we're preforming some form of update, be it update or delete (determined by existance of the interval)
            update: !(
              hasBooked || previousAttendance?.attendedInterval === interval
            ),
          };
        });

        const batch = db.batch();

        // Schedule the updates
        await Promise.all(
          updates.map(async ({ customerId, interval, update }) => {
            // Exit early if no update
            if (!update) {
              return;
            }

            const { secretKey } = await db
              .collection(Collection.Organizations)
              .doc(organization)
              .collection(OrgSubCollection.Customers)
              .doc(customerId)
              .get()
              .then((doc) => doc.data() as Customer);

            const attendedSlotRef = db
              .collection(Collection.Organizations)
              .doc(organization)
              .collection(OrgSubCollection.Bookings)
              .doc(secretKey)
              .collection(BookingSubCollection.AttendedSlots)
              .doc(slotId);

            // If interval exists, we're updating (or creating) the attended slot
            if (interval) {
              batch.set(attendedSlotRef, {
                date: currentAttendanceData.date,
                interval,
              });
              return;
            }

            // Finally, if interval doesn't exist, we're deleting the attended slot
            batch.delete(attendedSlotRef);
            return;
          })
        );

        await batch.commit();
      }
    )
  );

export const createCustomerStats = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Bookings}/{secretKey}/${BookingSubCollection.BookedSlots}/{bookingId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "createCustomerStats",
      async (change, context) => {
        const { organization, secretKey } = context.params as Record<
          string,
          string
        >;
        const { date } =
          change.after.data() || (change.before.data() as CustomerBookingEntry);

        if (!date) return;
        const db = admin.firestore();

        const bookingRef = db
          .collection(Collection.Organizations)
          .doc(organization)
          .collection(OrgSubCollection.Bookings)
          .doc(secretKey);

        // Fetch the booking document
        const { id: customerId } = (
          await bookingRef.get()
        ).data() as CustomerBookings;

        // Fetch documents from a subcollection of the booking
        const bookedSlotsSnapshot = await bookingRef
          .collection(BookingSubCollection.BookedSlots)
          .get();

        const bookedSlots: { [slotId: string]: CustomerBookingEntry } = {};
        bookedSlotsSnapshot.forEach((doc) => {
          bookedSlots[doc.id] = doc.data() as CustomerBookingEntry;
        });

        const monthStr = date.substring(0, 7);
        const monthSlots = (
          await db
            .collection(Collection.Organizations)
            .doc(organization)
            .collection(OrgSubCollection.SlotsByDay)
            .doc(monthStr)
            .get()
        ).data() as SlotsByDay;

        if (!monthSlots) return;
        const stats = getCustomerStats(bookedSlots, monthSlots, monthStr);
        // Set stats into customers doc
        await db
          .collection(Collection.Organizations)
          .doc(organization)
          .collection(OrgSubCollection.Customers)
          .doc(customerId)
          .set({ bookingStats: stats }, { merge: true });
      }
    )
  );
