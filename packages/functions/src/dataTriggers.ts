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

        // Use a transaction: the previous non-transactional read-modify-write
        // lost updates when two bookings for the same month changed
        // concurrently, permanently corrupting the counters that drive the
        // "slot is full" filtering in the athlete booking view.
        await db.runTransaction(async (tx) => {
          const doc = await tx.get(bookingCountsDocRef);
          const data = doc.data() || ({} as SlotBookingsCounts);

          const slotsBookings = data[bookingId] || 0;
          // Floor at 0: decrements for bookings whose counter was never
          // created (e.g. bulk deletions of legacy bookings) used to write
          // negative counts.
          const updatedCount = Math.max(0, slotsBookings + delta);

          tx.set(
            bookingCountsDocRef,
            { [bookingId]: updatedCount },
            { merge: true }
          );
        });
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
