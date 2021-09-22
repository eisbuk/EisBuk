import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { DateTime } from "luxon";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { fs2luxon } from "./utils";

/**
 * Adds the secret_key to a user if it's missing.
 * Updates a copy of a subset of user data in user's bookings doc, accessible by
 * anonymous users who have access to `secret_key`.
 */
export const addMissingSecretKey = functions
  .region("europe-west6")
  .firestore.document("organizations/{organization}/customers/{customerId}")
  .onWrite(async (change, context) => {
    const db = admin.firestore();

    const { organization, customerId } = context.params as Record<
      string,
      string
    >;

    const after = change.after.data()!;

    if (after) {
      const secretKey: string = after.secret_key || uuidv4();

      // Create a record in /bookings with this secret key as id
      // and the customer name
      const bookingsRoot = {
        // // eslint-disable-next-line @typescript-eslint/camelcase
        customer_id: customerId,
        ...(after.name && { name: after.name }),
        ...(after.surname && { surname: after.surname }),
        ...(after.category && { category: after.category }),
      };

      await db
        .collection("organizations")
        .doc(organization)
        .collection("bookings")
        .doc(secretKey)
        .set(bookingsRoot);

      return after.secret_key
        ? null
        : // // eslint-disable-next-line @typescript-eslint/camelcase
          change.after.ref.update({ secret_key: secretKey });
    }
    return change.after;
  });

/**
 * Maintain a copy of each slot in a different structure aggregated by month.
 * This allows to update small documents while still being able to get data for
 * a whole month in a single read.
 * The cost is one extra write per each update to the slots.
 */
export const aggregateSlots = functions
  .region("europe-west6")
  .firestore.document("organizations/{organization}/slots/{slotId}")
  .onWrite(async (change, context) => {
    const db = admin.firestore();

    const { organization, slotId: id } = context.params as Record<
      string,
      string
    >;

    let luxonDay: DateTime;
    let newSlot: FirebaseFirestore.DocumentData;

    const afterData = change.after.data();

    if (afterData) {
      newSlot = { ...afterData, id };
      luxonDay = DateTime.fromJSDate(new Date(newSlot.date.seconds * 1000));
    } else {
      luxonDay = DateTime.fromJSDate(
        new Date(change.before.data()!.date.seconds * 1000)
      );
      newSlot = admin.firestore.FieldValue.delete();
    }

    const monthStr = luxonDay.toISO().substring(0, 7);
    const dayStr = luxonDay.toISO().substring(0, 10);

    await db
      .collection("organizations")
      .doc(organization)
      .collection("slotsByDay")
      /** @TODO : Maybe name these slotsByMonth to avoid confusion */
      .doc(monthStr)
      .set({ [dayStr]: { [id]: newSlot } }, { merge: true });

    return change.after;
  });

/**
 * Maintain a copy of each slot in a different structure aggregated by month.
 * This allows to update small documents while still being able to get data for
 * a whole month in a single read.
 * The cost is one extra write per each update to the slots.
 */
export const aggregateBookings = functions
  .region("europe-west6")
  .firestore.document(
    "organizations/{organization}/bookings/{secretKey}/data/{bookingId}"
  )
  .onWrite(async (change, context) => {
    const db = admin.firestore();

    const { organization, secretKey } = context.params as Record<
      string,
      string
    >;

    const userData = (
      await db
        .collection("organizations")
        .doc(organization)
        .collection("bookings")
        .doc(secretKey)
        .get()
    ).data();

    const customerId = userData!.customer_id;

    // check if update or delete
    const isUpdate = change.after.exists;

    const bookingData = isUpdate ? change.after.data()! : change.before.data()!;

    const luxonDay = fs2luxon(bookingData.date);
    const monthStr = luxonDay.toISO().substring(0, 7);

    // on update field value will be duration from update
    // on delete it will be delete sentinel
    const fieldValue = isUpdate
      ? bookingData.duration
      : admin.firestore.FieldValue.delete();

    if (!change.after.exists) functions.logger.log("deleting");

    return db
      .collection("organizations")
      .doc(organization)
      .collection("bookingsByDay")
      .doc(monthStr)
      .set({ [bookingData.id]: { [customerId]: fieldValue } }, { merge: true });
  });

/**
 * Data trigger used to update attendance entries for slot whenever customer books a certain slot + interval.
 *
 * - listens to `organizations/{organization}/bookings/{secretKey}/bookedSlots/{slotId}`
 * - writes to `organizations/{organization}/attendnace/{slotId}` - updates entry for `attendances[customerId]` leaving the rest of the doc unchanged
 */
export const aggregateAttendance = functions
  .region("europe-west6")
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Bookings}/{secretKey}/bookedSlots/{bookingId}`
  )
  .onWrite(async (change, context) => {
    const { organization, secretKey, bookingId } = context.params as Record<
      string,
      string
    >;
    const db = admin.firestore();

    const isUpdate = Boolean(change.after.exists);

    const { customerId } = (
      await db
        .collection(Collection.Organizations)
        .doc(organization)
        .collection(OrgSubCollection.Bookings)
        .doc(secretKey)
        .get()
    ).data()!;

    const updatedEntry = {
      attendances: {
        [customerId]: isUpdate
          ? {
              booked: change.after.data()!.interval,
              attended: null,
            }
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
