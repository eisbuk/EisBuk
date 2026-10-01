/* eslint-disable no-case-declarations */
import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { v4 as uuid } from "uuid";
import { isEqual } from "lodash";

import {
  wrapFirestoreOnCreateHandler,
  wrapFirestoreOnWriteHandler,
} from "./sentry-serverless-firebase";
import { __functionsZone__ } from "./constants";
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
  CustomerBookings,
  SlotsByDay,
} from "@eisbuk/shared";

import { getCustomerStats } from "./utils";
import {
  getAttendedSlotInterval,
  getSecretKeys,
  syncAttendanceEntry,
  syncAttendedSlot,
  syncSlotBookingsCount,
} from "./bookingSync";

/**
 * A type alias for Customer with `secretKey` and `id` optional
 */
type CustomerWithOptionalIDs = Omit<Customer, "id" | "secretKey"> &
  Partial<{ secretKey: string; id: string }>;

/**
 * Runtime options of the triggers keeping booking-derived data in sync (`countSlotsBookings`,
 * `createAttendanceForBooking`, `syncAttendanceWithBookings`).
 *
 * Their handlers derive the data from the current bookings, so running them again is safe: a failed run (a
 * transaction that ran out of attempts, the recount's index still building after a deploy) is retried instead of
 * leaving the data wrong.
 */
const bookingSyncRuntimeOptions: functions.RuntimeOptions = {
  memory: "512MB",
  failurePolicy: true,
};

/**
 * Events are retried for up to 7 days. Past this age, a still failing event is dropped (and logged): the next write
 * or the reconciliation brings the data in line, and a persistent error shouldn't be retried for a week.
 */
const maxRetriedEventAge = 24 * 60 * 60 * 1000;

/**
 * Waits for all the (independent) syncs of a trigger, and fails if any of them failed, for the event to be retried.
 * The error carries error codes only: Firestore error messages can contain document paths, with secret keys.
 */
const settleAll = async (name: string, syncs: Promise<unknown>[]) => {
  const results = await Promise.allSettled(syncs);
  const codes = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map(({ reason }) => (reason as { code?: unknown })?.code ?? "unknown");
  if (codes.length) {
    throw new Error(
      `${name}: ${codes.length} of ${
        results.length
      } syncs failed (codes: ${codes.join(", ")})`
    );
  }
};
const isTooOldToRetry = (name: string, context: functions.EventContext) => {
  const age = Date.now() - Date.parse(context.timestamp);
  if (age <= maxRetriedEventAge) return false;
  functions.logger.warn(`${name}: dropping event older than 24 hours`, {
    eventId: context.eventId,
    timestamp: context.timestamp,
  });
  return true;
};

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

        const orgRef = db
          .collection(Collection.Organizations)
          .doc(organization);
        const attendanceEntryRef = orgRef
          .collection(OrgSubCollection.Attendance)
          .doc(slotId);
        const slotRef = orgRef.collection(OrgSubCollection.Slots).doc(slotId);

        switch (true) {
          case isCreate:
            // Firestore triggers are at-least-once and unordered: when a slot is
            // created and deleted in quick succession, this create event can be
            // processed *after* the delete event, which would resurrect the
            // attendance entry as an orphan. Re-read the slot inside a
            // transaction and only create the entry if the slot still exists.
            await db.runTransaction(async (tx) => {
              const slotSnap = await tx.get(slotRef);
              if (!slotSnap.exists) {
                return;
              }
              // check if attendance entry already exists (in case we're dumping/restoring the data)
              const attendanceSnap = await tx.get(attendanceEntryRef);
              if (attendanceSnap.exists) {
                return;
              }
              // add empty entry for slot's attendance
              tx.set(attendanceEntryRef, {
                date: slotSnap.data()!.date,
                attendances: {},
              } as SlotAttendnace);
            });
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

      const deleteSentinel = admin.firestore.FieldValue.delete();

      const orgRef = db.collection(Collection.Organizations).doc(organization);
      const slotRef = orgRef.collection(OrgSubCollection.Slots).doc(id);
      const getMonthRef = (date: string) =>
        orgRef
          .collection(OrgSubCollection.SlotsByDay)
          .doc(date.substring(0, 7));

      const beforeData = change.before.data() as SlotInterface | undefined;
      const eventDate = (change.after.data() || change.before.data())!
        .date as string;

      // Firestore triggers are at-least-once and unordered: when a slot is
      // created (or updated) and deleted within a short period, this handler can
      // process the create event *after* the delete event, overwriting the
      // delete sentinel and resurrecting the slot in the (publicly readable)
      // aggregate - a "ghost" slot athletes see but can never book, and which
      // the admin can't remove (deleting the already-absent slot doc fires no
      // trigger). Instead of trusting the event snapshot, re-read the slot
      // inside a transaction and write the aggregate from current truth.
      await db.runTransaction(async (tx) => {
        const currentSlot = await tx.get(slotRef);

        if (!currentSlot.exists) {
          // Slot is gone (delete event, or a stale create/update event arriving
          // after deletion): remove the aggregate entry wherever the event saw it
          tx.set(
            getMonthRef(eventDate),
            { [eventDate]: { [id]: deleteSentinel } },
            { merge: true }
          );
          // If the event also saw an older date (date-edit), clear that location too
          if (beforeData && beforeData.date !== eventDate) {
            tx.set(
              getMonthRef(beforeData.date),
              { [beforeData.date]: { [id]: deleteSentinel } },
              { merge: true }
            );
          }
          return;
        }

        const { intervals: newIntervals, ...updatedData } =
          currentSlot.data() as Omit<SlotInterface, "id">;
        const date = updatedData.date;

        // we're using {merge: true} flag for setting the document so
        // we need to process intervals in order to make sure the old intervals get deleted
        // and only the updated values remain (prevent merging of the old values with the new)
        const deletedIntervals = Object.keys(
          beforeData?.intervals || {}
        ).reduce(
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

        const newSlot = { ...updatedData, intervals, id } as SlotInterface;

        // If the slot's date was edited, remove the aggregate entry from the old
        // date/month (previously the old entry was left behind, duplicating the
        // slot across months)
        if (beforeData && beforeData.date !== date) {
          tx.set(
            getMonthRef(beforeData.date),
            { [beforeData.date]: { [id]: deleteSentinel } },
            { merge: true }
          );
        }

        tx.set(
          getMonthRef(date),
          { [date]: { [id]: newSlot } },
          { merge: true }
        );
      });

      return change.after;
    })
  );

export const countSlotsBookings = functions
  .runWith(bookingSyncRuntimeOptions)
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Bookings}/{secretKey}/${BookingSubCollection.BookedSlots}/{bookingId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "countSlotsBookings",
      async (change, context) => {
        if (isTooOldToRetry("countSlotsBookings", context)) return;

        const { organization, bookingId } = context.params as Record<
          string,
          string
        >;

        // If the booking was merely updated, the number of bookings didn't change
        if (change.before.exists && change.after.exists) {
          return;
        }

        const db = admin.firestore();

        const date: string | undefined = (
          change.before.data() || change.after.data()
        )?.date;
        if (!date) return;

        // Recount instead of applying +1/-1 from the event: events are delivered at least once and
        // unordered, so a redelivered or late event used to count a booking twice or count a
        // cancelled one (#987). See `syncSlotBookingsCount`.
        //
        // Until the collection group index the recount needs is ready (right after a deploy), this fails and
        // is retried (`failurePolicy`).
        await syncSlotBookingsCount(db, organization, bookingId, date);
      }
    )
  );

/**
 * Data trigger used to update attendance entries for slot whenever customer books a certain slot + interval.
 *
 * - listens to `organizations/{organization}/bookings/{secretKey}/bookedSlots/{slotId}`
 * - writes to `organizations/{organization}/attendnace/{slotId}` - updates entry for `attendances[customerId]` leaving the rest of the doc unchanged
 *
 * The entry is derived from the current booking, not from the event (which can be redelivered or arrive after a
 * newer one, #988), and an attended interval recorded by the admin is preserved. See `syncAttendanceEntry`.
 */
export const createAttendanceForBooking = functions
  .runWith(bookingSyncRuntimeOptions)
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Bookings}/{secretKey}/${BookingSubCollection.BookedSlots}/{bookingId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "createAttendanceForBooking",
      async (_change, context) => {
        if (isTooOldToRetry("createAttendanceForBooking", context)) return;

        const { organization, secretKey, bookingId } = context.params as Record<
          string,
          string
        >;
        const db = admin.firestore();

        // A booking under any of the athlete's bookings documents counts
        const bookings = await db
          .collection(Collection.Organizations)
          .doc(organization)
          .collection(OrgSubCollection.Bookings)
          .doc(secretKey)
          .get();
        const customerId = (bookings.data() as CustomerBookings | undefined)
          ?.id;
        const secretKeys = customerId
          ? await getSecretKeys(db, organization, customerId)
          : [];

        await syncAttendanceEntry(db, organization, bookingId, [
          secretKey,
          ...secretKeys,
        ]);
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
 * Keeps the booked part of attendance in line with the bookings when the attendance document is written
 * by someone else than `createAttendanceForBooking`.
 *
 * The admin attendance screen writes whole entries (`bookedInterval` included), or the whole document, from the
 * admin's local copy. A copy older than the latest booking change puts an old `bookedInterval` back, or drops the
 * entry of a booking made in the meantime, and no booking event follows to correct it (#988).
 *
 * For every athlete whose entry was added, removed, or had its booked part changed by this write, re-derive the
 * entry from the athlete's current booking. Changes to `attendedInterval` alone are not checked. `syncAttendanceEntry`
 * writes only when the entry differs, so the write it may cause is followed by a check that finds nothing to do.
 *
 * The booking is looked up under all of the athlete's bookings documents. Athletes without a bookings document are
 * left as they are. Each athlete is synced independently: if some fail, the others are still written and the
 * function then fails, to be retried (`failurePolicy`).
 */
export const syncAttendanceWithBookings = functions
  .runWith(bookingSyncRuntimeOptions)
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Attendance}/{slotId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "syncAttendanceWithBookings",
      async (change, context) => {
        // Attendance document deleted with the slot: nothing to keep in sync
        if (!change.after.exists) return;
        if (isTooOldToRetry("syncAttendanceWithBookings", context)) return;

        const { organization, slotId } = context.params as Record<
          string,
          string
        >;
        const db = admin.firestore();

        const before = (change.before.data() as SlotAttendnace | undefined)
          ?.attendances;
        const after = (change.after.data() as SlotAttendnace).attendances;

        const getBookedPart = (entry?: CustomerAttendance) =>
          entry && { b: entry.bookedInterval, n: entry.bookingNotes };
        const customerIds = [
          ...new Set([
            ...Object.keys(before || {}),
            ...Object.keys(after || {}),
          ]),
        ].filter(
          (id) =>
            !isEqual(getBookedPart(before?.[id]), getBookedPart(after?.[id]))
        );

        await settleAll(
          "syncAttendanceWithBookings",
          customerIds.map(async (customerId) => {
            const secretKeys = await getSecretKeys(
              db,
              organization,
              customerId
            );
            // Unknown athlete (no bookings document): leave the entry as it is
            await syncAttendanceEntry(db, organization, slotId, secretKeys);
          })
        );
      }
    )
  );

/**
 * A data trigger used to create entries for `attendedSlots` in each respective customer's bookings, to make it
 * available for the client to see (in their calendar) that they have been marked present for a certain slot.
 *
 * Note: We're only creating attended slot entries for customers who haven't booked the same slot
 * (as the booking is displayed in their calendar in that case).
 *
 * The attended slot is derived from the current attendance entry (see `syncAttendedSlot`): it exists while the entry
 * has an attended interval and no booked interval. That includes an athlete who cancelled the booking after the admin
 * recorded attendance. Each customer is synced independently: if some fail, the function fails at the end and is
 * retried.
 */
export const createAttendedSlotOnAttendance = functions
  .runWith(bookingSyncRuntimeOptions)
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Attendance}/{slotId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "createAttendedSlotOnAttendance",
      async (change, context) => {
        if (isTooOldToRetry("createAttendedSlotOnAttendance", context)) return;

        const { organization, slotId } = context.params as Record<
          string,
          string
        >;

        const previousAttendances =
          (change.before.data() as SlotAttendnace | undefined)?.attendances ||
          {};
        const eventAttendances =
          (change.after.data() as SlotAttendnace | undefined)?.attendances ||
          {};

        // Customers whose attended slot this write changes
        const ids = [
          ...new Set([
            ...Object.keys(eventAttendances),
            ...Object.keys(previousAttendances),
          ]),
        ].filter(
          (id) =>
            getAttendedSlotInterval(previousAttendances[id]) !==
            getAttendedSlotInterval(eventAttendances[id])
        );

        const db = admin.firestore();
        await settleAll(
          "createAttendedSlotOnAttendance",
          ids.map((customerId) =>
            syncAttendedSlot(db, organization, slotId, customerId)
          )
        );
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
