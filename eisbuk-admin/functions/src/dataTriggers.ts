/* eslint-disable no-case-declarations */
import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { DateTime } from "luxon";

import {
  BookingSubCollection,
  Collection,
  Customer,
  CustomerAttendance,
  CustomerBase,
  CustomerBookingEntry,
  OrgSubCollection,
  SlotAttendnace,
  SlotInterface,
  SlotInterval,
} from "eisbuk-shared";
import { fs2luxon } from "./utils";

/**
 * Adds the secret_key to a user if it's missing.
 * Updates a copy of a subset of user data in user's bookings doc, accessible by
 * anonymous users who have access to `secret_key`.
 */
export const addMissingSecretKey = functions
  .region("europe-west6")
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Customers}/{customerId}`
  )
  .onWrite(async (change, context) => {
    const db = admin.firestore();

    const { organization, customerId } = context.params as Record<
      string,
      string
    >;

    const after = change.after.data() as
      | (Omit<Customer, "secretKey"> & { secretKey?: string })
      | undefined;

    if (after) {
      const secretKey = after.secretKey || uuidv4();

      // Create a record in /bookings with this secret key as id
      // and the customer name
      const bookingsRoot: CustomerBase = {
        // // eslint-disable-next-line @typescript-eslint/camelcase
        id: customerId,
        name: after.name || "",
        surname: after.surname || "",
        category: after.category || "",
      };

      await db
        .collection(Collection.Organizations)
        .doc(organization)
        .collection(OrgSubCollection.Bookings)
        .doc(secretKey)
        .set(bookingsRoot);

      return after.secretKey
        ? null
        : // // eslint-disable-next-line @typescript-eslint/camelcase
          change.after.ref.update({ secretKey } as Pick<Customer, "secretKey">);
    }
    return change.after;
  });

/**
 * Adds the `month` string to a `slotsByDay` document (a month entry),
 * this `month` string is the same one used to index the document. This is merely for
 * easier querying.
 */
export const addMonthIndex = functions
  .region("europe-west6")
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.SlotsByDay}/{month}`
  )
  .onWrite(async (change, context) => {
    const db = admin.firestore();

    const { organization, month } = context.params as Record<string, string>;

    // we're running this function only on create, not on update or delete
    // we're assuming that the month string already exists if the document has already been created
    const isCreate = change.after.exists && !change.before.exists;

    if (isCreate) {
      await db
        .collection(Collection.Organizations)
        .doc(organization)
        .collection(OrgSubCollection.SlotsByDay)
        .doc(month)
        .set({ month }, { merge: true });
    }
  });

/**
 * Data trigger listening to create/delete slot document and creates/deletes attendance entry for given slot.
 * Doesn't run if slot is only updated.
 */
export const triggerAttendanceEntryForSlot = functions
  .region("europe-west6")
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
        // add empay entry for slot's attendance
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
  .region("europe-west6")
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Slots}/{slotId}`
  )
  .onWrite(async (change, context) => {
    const { organization, slotId: id } = context.params as Record<
      string,
      string
    >;

    const db = admin.firestore();

    let luxonDay: DateTime;
    let newSlot: SlotInterface | FirebaseFirestore.FieldValue;

    const isCreate = !change.before.exists;
    const isDelete = !change.after.exists;

    const deleteSentinel = admin.firestore.FieldValue.delete();

    switch (true) {
      case isDelete:
        // if deleting, we're just setting slot value as delete sentinel and getting the date from before
        const beforeData = change.before.data() as SlotInterface;
        luxonDay = fs2luxon(beforeData.date);
        newSlot = deleteSentinel;
        break;
      case isCreate:
        // if creating, we're only using the new (after data) and adding generated id
        const afterData = change.after.data()! as Omit<SlotInterface, "id">;
        newSlot = { ...afterData, id };
        luxonDay = fs2luxon(newSlot.date);
        break;
      default:
        // if not change or create: is update
        const {
          intervals: newIntervals,
          ...updatedData
        } = change.after.data() as Omit<SlotInterface, "id">;
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
        luxonDay = fs2luxon(newSlot.date);
    }

    const monthStr = luxonDay.toISO().substring(0, 7);
    const dayStr = luxonDay.toISO().substring(0, 10);

    const monthSlotsRef = db
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.SlotsByDay)
      .doc(monthStr);

    await monthSlotsRef.set({ [dayStr]: { [id]: newSlot } }, { merge: true });

    return change.after;
  });

/**
 * Data trigger used to update attendance entries for slot whenever customer books a certain slot + interval.
 *
 * - listens to `organizations/{organization}/bookings/{secretKey}/bookedSlots/{slotId}`
 * - writes to `organizations/{organization}/attendnace/{slotId}` - updates entry for `attendances[customerId]` leaving the rest of the doc unchanged
 */
export const createAttendanceForBooking = functions
  .region("europe-west6")
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
    ).data() as CustomerBase;

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

    await db
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.Attendance)
      .doc(bookingId)
      .set(updatedEntry, { merge: true });
  });
