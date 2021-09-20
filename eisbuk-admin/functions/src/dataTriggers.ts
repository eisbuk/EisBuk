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
} from "eisbuk-shared";
import fs from "fs";

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

    let attendanceEntry: SlotAttendnace | FirebaseFirestore.FieldValue;

    const isCreate = !change.before.exists;
    const isDelete = !change.after.exists;

    switch (true) {
      case !isCreate:
        // add empay entry for slot's attendance
        attendanceEntry = {
          date: change.after.data()!.date,
          attendances: {},
        } as SlotAttendnace;
        break;
      case !isDelete:
        // delete attendance entry for slot
        attendanceEntry = admin.firestore.FieldValue.delete();
        break;
      default:
        // exit if slot was just updated
        return;
    }

    await db
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.Attendance)
      .doc(slotId)
      .set(attendanceEntry);
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

    let report: Record<string, any> = { organization, id };
    try {
      const db = admin.firestore();

      let luxonDay: DateTime;
      let newSlot: SlotInterface | FirebaseFirestore.FieldValue;

      if (change.after.exists) {
        const afterData = change.after.data()! as SlotInterface;
        report = { ...report, afterData };
        newSlot = { ...afterData, id };
        luxonDay = DateTime.fromJSDate(new Date(newSlot.date.seconds * 1000));
      } else {
        const beforeData = change.before.data()!;
        report = { ...report, beforeData };
        luxonDay = DateTime.fromJSDate(
          new Date(beforeData.date.seconds * 1000)
        );
        newSlot = admin.firestore.FieldValue.delete();
      }

      const monthStr = luxonDay.toISO().substring(0, 7);
      const dayStr = luxonDay.toISO().substring(0, 10);

      const monthSlotsRef = db
        .collection(Collection.Organizations)
        .doc(organization)
        .collection(OrgSubCollection.SlotsByDay)
        .doc(monthStr);

      await monthSlotsRef.set({ [dayStr]: { [id]: newSlot } }, { merge: true });

      const monthSlots = (await monthSlotsRef.get()).data();

      logToFS({ ...report, monthSlots });
      return change.after;
    } catch {
      logToFS(report);
      return change.after;
    }
  });

const logToFS = (data: Record<string, any>) => {
  const timeString = Date.now().toString();
  const dataString = JSON.stringify(data, null, 2);
  fs.writeFileSync(`./logs/${timeString}.json`, dataString);
};

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
