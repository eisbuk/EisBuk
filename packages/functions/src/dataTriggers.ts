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
  CustomerBookings,
  OrgSubCollection,
  SlotAttendnace,
  sanitizeCustomer,
  OrganizationData,
  Customer,
} from "@eisbuk/shared";

import {
  syncSlotAggregate,
  syncSlotAttendance,
  slotDateNamespace,
} from "./slotSync";
import {
  getStatsDates,
  syncCustomerBookingStats,
  syncCustomerStatsForSlot,
} from "./customerStats";
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
 * Runtime options of the triggers keeping booking-derived data and customer mirrors in sync.
 *
 * Their handlers derive the data from the current state, so running them again is safe: a failed run (a
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

const isTooOldToRetry = (name: string, context: functions.EventContext) => {
  const age = Date.now() - Date.parse(context.timestamp);
  if (age <= maxRetriedEventAge) return false;
  functions.logger.warn(`${name}: dropping event older than 24 hours`, {
    eventId: context.eventId,
    timestamp: context.timestamp,
  });
  return true;
};

/**
 * gRPC codes of errors worth retrying: they can go away by themselves (contention, timeouts, unavailability).
 */
const transientErrorCodes = new Set([
  2, // UNKNOWN
  4, // DEADLINE_EXCEEDED
  8, // RESOURCE_EXHAUSTED
  10, // ABORTED
  13, // INTERNAL
  14, // UNAVAILABLE
]);
const getErrorCode = (error: unknown) =>
  (error as { code?: unknown } | undefined)?.code;
/**
 * FAILED_PRECONDITION (9) is transient only for an index that is still building (right after a deploy); for a
 * missing index (or another precondition) retrying can't help.
 */
const isTransientError = (error: unknown) => {
  const code = getErrorCode(error);
  if (code === 9) {
    return /currently building/i.test(String((error as Error)?.message));
  }
  return transientErrorCodes.has(code as number);
};

/**
 * Waits for all the (independent) syncs of a trigger.
 *
 * If any failed with a transient error, fails for the event to be retried (`failurePolicy`). Other failures (invalid
 * data, a bug) would fail on every retry: they are logged and the event is not retried; the reconciliation reports
 * what they left. Logs and errors carry error codes only: Firestore error messages can contain document paths, with
 * secret keys.
 */
const settleAll = async (name: string, syncs: Promise<unknown>[]) => {
  const results = await Promise.allSettled(syncs);
  const failures = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map(({ reason }) => reason);
  const codes = failures.map(getErrorCode);
  const transient = failures.filter(isTransientError).map(getErrorCode);
  if (transient.length) {
    throw new Error(
      `${name}: ${transient.length} of ${
        results.length
      } syncs failed with transient errors (codes: ${transient.join(", ")})`
    );
  }
  if (codes.length) {
    functions.logger.error(
      `${name}: ${codes.length} of ${results.length} syncs failed, not retried`,
      { codes: codes.map((code) => String(code ?? "none")) }
    );
  }
};

export const addIdToSlot = functions
  .runWith(bookingSyncRuntimeOptions)
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Slots}/{slotId}`
  )
  .onCreate(
    wrapFirestoreOnCreateHandler("addIdToSlot", async ({ ref }, context) => {
      if (isTooOldToRetry("addIdToSlot", context)) return;
      const { slotId } = context.params as Record<string, string>;
      await settleAll("addIdToSlot", [
        ref.firestore.runTransaction(async (tx) => {
          const current = await tx.get(ref);
          if (current.exists && current.data()?.id !== slotId) {
            tx.update(ref, { id: slotId });
          }
        }),
      ]);
    })
  );

/**
 * Adds server generated `id` and a `secretKey` to a customer on create.
 * Updates a copy of a subset of customer's data in customer's bookings doc, accessible by
 * anonymous users who have access to `secretKey`.
 */
export const addCustomerIdAndSecretKey = functions
  .runWith(bookingSyncRuntimeOptions)
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Customers}/{customerId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "addCustomerIdAndSecretKey",
      async (change, context) => {
        if (isTooOldToRetry("addCustomerIdAndSecretKey", context)) return;
        const db = admin.firestore();
        const { organization, customerId } = context.params as Record<
          string,
          string
        >;
        const orgRef = db
          .collection(Collection.Organizations)
          .doc(organization);
        const customerRef = orgRef
          .collection(OrgSubCollection.Customers)
          .doc(customerId);
        const bookingsRef = orgRef.collection(OrgSubCollection.Bookings);

        // Events may be delayed or repeated. Assign identity and mirror the current
        // profile in one transaction so a retry cannot rotate the key or resurrect a customer.
        await settleAll("addCustomerIdAndSecretKey", [
          db.runTransaction(async (tx) => {
            const current = await tx.get(customerRef);
            const mirrors = await tx.get(
              bookingsRef.where("id", "==", customerId)
            );
            const data = current.data() as CustomerWithOptionalIDs | undefined;
            const secretKey = data ? data.secretKey || uuid() : undefined;

            // Keep historical subcollections accessible to reconciliation, but prevent
            // obsolete keys and hard-deleted profiles from authorizing new bookings.
            mirrors.docs.forEach((mirror) => {
              if (mirror.id !== secretKey) {
                tx.update(mirror.ref, { deleted: true, categories: [] });
              }
            });
            if (!data || !secretKey) return;

            if (data.id !== customerId || data.secretKey !== secretKey) {
              tx.update(customerRef, { id: customerId, secretKey });
            }
            tx.set(
              bookingsRef.doc(secretKey),
              sanitizeCustomer({
                ...data,
                id: customerId,
                secretKey,
                ...(data.deleted ? { categories: [] } : {}),
              } as Customer)
            );
          }),
        ]);
      }
    )
  );

/** Keeps the attendance container and date aligned with the current source slot. */
export const triggerAttendanceEntryForSlot = functions
  .runWith(bookingSyncRuntimeOptions)
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Slots}/{slotId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "triggerAttendanceEntryForSlot",
      async (_change, context) => {
        if (isTooOldToRetry("triggerAttendanceEntryForSlot", context)) return;
        const { organization, slotId } = context.params as Record<
          string,
          string
        >;
        await settleAll("triggerAttendanceEntryForSlot", [
          syncSlotAttendance(admin.firestore(), organization, slotId),
        ]);
      }
    )
  );

/**
 * Maintain a copy of each slot in a different structure aggregated by month.
 * This allows to update small documents while still being able to get data for
 * a whole month in a single read.
 * Each sync reads the current slot and affected months, then writes changed leaves.
 */
export const aggregateSlots = functions
  .runWith(bookingSyncRuntimeOptions)
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Slots}/{slotId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler("aggregateSlots", async (change, context) => {
      if (isTooOldToRetry("aggregateSlots", context)) return;
      const { organization, slotId } = context.params as Record<string, string>;
      const locations = getStatsDates(
        change.before.data()?.date,
        change.after.data()?.date
      ).map(slotDateNamespace);
      await settleAll("aggregateSlots", [
        syncSlotAggregate(admin.firestore(), organization, slotId, locations),
      ]);
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

        // Interval/notes edits leave counts unchanged; date edits can move a booking between months.
        if (
          change.before.exists &&
          change.after.exists &&
          change.before.data()?.date === change.after.data()?.date
        ) {
          return;
        }

        const db = admin.firestore();

        const dates = getStatsDates(
          change.before.data()?.date,
          change.after.data()?.date
        );
        if (!dates.length) {
          functions.logger.warn("countSlotsBookings: booking without a date");
          return;
        }

        // Recount instead of applying +1/-1 from the event: events are delivered at least once and
        // unordered, so a redelivered or late event used to count a booking twice or count a
        // cancelled one (#987). See `syncSlotBookingsCount`.
        //
        // Until the collection group index the recount needs is ready (right after a deploy), this fails and
        // is retried (`failurePolicy`).
        const months = [...new Set(dates.map((date) => date.substring(0, 7)))];
        await settleAll(
          "countSlotsBookings",
          months.map((month) =>
            syncSlotBookingsCount(db, organization, bookingId, `${month}-01`)
          )
        );
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

        const sync = async () => {
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
        };
        await settleAll("createAttendanceForBooking", [sync()]);
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
  .runWith(bookingSyncRuntimeOptions)
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Bookings}/{secretKey}/${BookingSubCollection.BookedSlots}/{bookingId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "createCustomerStats",
      async (change, context) => {
        if (isTooOldToRetry("createCustomerStats", context)) return;
        const { organization, secretKey } = context.params as Record<
          string,
          string
        >;
        const dates = getStatsDates(
          change.before.data()?.date,
          change.after.data()?.date
        );
        if (!dates.length) return;
        const db = admin.firestore();
        await settleAll("createCustomerStats", [
          (async () => {
            const mirror = await db
              .collection(Collection.Organizations)
              .doc(organization)
              .collection(OrgSubCollection.Bookings)
              .doc(secretKey)
              .get();
            const customerId = mirror.data()?.id;
            if (typeof customerId !== "string" || !customerId) return;
            await Promise.all(
              [...new Set(dates.map((date) => date.substring(0, 7)))].map(
                (month) =>
                  syncCustomerBookingStats(db, organization, customerId, month)
              )
            );
          })(),
        ]);
      }
    )
  );

export const createCustomerStatsForSlot = functions
  .runWith(bookingSyncRuntimeOptions)
  .region(__functionsZone__)
  .firestore.document(
    `${Collection.Organizations}/{organization}/${OrgSubCollection.Slots}/{slotId}`
  )
  .onWrite(
    wrapFirestoreOnWriteHandler(
      "createCustomerStatsForSlot",
      async (change, context) => {
        if (isTooOldToRetry("createCustomerStatsForSlot", context)) return;
        const { organization, slotId } = context.params as Record<
          string,
          string
        >;
        const db = admin.firestore();
        await settleAll("createCustomerStatsForSlot", [
          (async () => {
            const current = await change.after.ref.get();
            const dates = getStatsDates(
              change.before.data()?.date,
              change.after.data()?.date,
              current.data()?.date
            );
            await syncCustomerStatsForSlot(db, organization, slotId, dates);
          })(),
        ]);
      }
    )
  );
