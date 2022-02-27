import admin from "firebase-admin";
import * as functions from "firebase-functions";
import _ from "lodash";
import {
  WriteBatch,
  DocumentReference,
  DocumentData,
} from "@google-cloud/firestore";

import {
  Collection,
  Category,
  CustomerBase,
  OrgSubCollection,
} from "eisbuk-shared";
import {
  DeprecatedOrgSubCollection,
  DeprecatedBookingsMeta,
} from "eisbuk-shared/dist/deprecated";

import { __functionsZone__ } from "../constants";

import { checkUser } from "../utils";

// #region migrateSlotsToPluralCategories
/**
 * A migration we used after project's MVP to migrate slots from using single `category`
 * into `categories` (as we're using now). The migration replaces all deprecated `category` fields
 * with new `categories` field, having initial value of single entry array (old category)
 */
export const migrateSlotsToPluralCategories = functions
  .region(__functionsZone__)
  .https.onCall(async ({ organization }: { organization: string }, context) => {
    await checkUser(organization, context.auth);

    const org = admin.firestore().collection("organizations").doc(organization);
    const existing = await org.collection("slots").get();

    const operations: Promise<any>[] = [];

    existing.forEach((el) => {
      const slotData = el.data();
      const { category } = slotData as { category: Category };

      if (category) {
        const newData = {
          // Remove the old `category` field and add the new `categories` one
          ..._.omit(slotData, "category"),
          categories: [category],
        };
        operations.push(org.collection("slots").doc(el.id).set(newData));
      }
    });

    functions.logger.info(`Updating ${operations.length} records`);

    await Promise.all(operations);
    functions.logger.info(`Finished: ${operations.length} records updated`);
  });
// #endregion migrateSlotsToPluralCategories

// #region migrateToNewDataModel
/**
 * A migration we used when migrating to a new data model. The data model change was quite large
 * and introduced brakig changes so we've decided to simply prune the entries belonging to the old
 * data model, without affecting the new data model entries. Only the `customers` collection entries
 * had a minor fix (`secret_key` -> `secretKey`)
 *
 * The migration works through "enqueue migration" helpers (defined below) all in charge of pruning their
 * respective collection and returning a one promise (`Promise.all`) for deletions. We used this to run all deletions
 * in parallel (by awaiting one top level `Promise.all`)
 *
 * Underlaying data model change:
 *
 * **Slots**
 * `durations` -> `slotIntervals`
 *
 * **BookingsByDay**
 * Deleted entirely as it's functionality was replaced by:
 * - `bookedSlots` collection (within customer's `bookings`) for booking purposes
 * - `attendance` collection for attendance tracking purposes
 *
 * **Customers**
 * `secret_key` -> `secretKey`
 *
 * **Bookings**
 * `customer_id` -> `id`
 * `data` (deleted) -> (replaced by) `bookedSlots` (new data model slots)
 */
export const migrateToNewDataModel = functions
  .region(__functionsZone__)
  .https.onCall(async ({ organization }: { organization: string }) => {
    try {
      // await checkUser(organization, context.auth);
      functions.logger.log("Started migration to new data model");

      const db = admin.firestore();
      const batch = db.batch();
      const orgRef = db.collection(Collection.Organizations).doc(organization);

      const migrations = [
        enqueueSlotMigrations({ orgRef, batch }),
        enqueueBookingsMigrations({ orgRef, batch }),
        enqueueBookingsByDayDeletion({ orgRef, batch }),
        enqueueCustomersMigrations({ orgRef, batch }),
      ];

      await Promise.all(migrations);

      await batch.commit();

      functions.logger.log(
        `All enqueued operations successfully commited, data model successfully migrated`
      );

      return { success: true };
    } catch {
      return { success: false };
    }
  });

/**
 * Standard interface for migration handlers, used to enqueue db operations
 * to provided `batch`. Returns a promise so that we can await all handlers before commiting batch
 */
interface EnqueueMigration {
  (params: {
    /**
     * Firestore write batch, initialized outside the handler (in migrations function)
     * and passed down to handler so that all of the handlers write to the same batch
     */
    batch: WriteBatch;
    /**
     * Firestore reference to the `organization` entry (in database) we're writing to
     * pass in db instance as well as a shortcut to the organization (to reduce typing)
     */
    orgRef: DocumentReference<DocumentData>;
  }): Promise<void>;
}

const enqueueSlotMigrations: EnqueueMigration = async ({ batch, orgRef }) => {
  try {
    functions.logger.log("Processing slots");

    const slotsRef = orgRef.collection(DeprecatedOrgSubCollection.Slots);

    const slotsCollection = await slotsRef.get();

    if (!slotsCollection.empty) {
      slotsCollection.forEach((slotSnapshot) => {
        const slotId = slotSnapshot.id;
        const slot = slotSnapshot.data();
        // check deprecated and queue for deletion
        if (Object.keys(slot).includes("durations")) {
          batch.delete(slotsRef.doc(slotId));
        }
      });
    }
    functions.logger.log("All stale slots successfully enqueued for deletion");
  } catch (error) {
    functions.logger.error(error);
  }
};

const enqueueBookingsByDayDeletion: EnqueueMigration = async ({
  batch,
  orgRef,
}) => {
  try {
    functions.logger.log("Enqueueing all 'bookingsByDay' for deletion");

    const bookingsByDayRef = orgRef.collection(
      DeprecatedOrgSubCollection.BookingsByDay
    );

    const bookingsByDayCollection = await bookingsByDayRef.get();

    if (!bookingsByDayCollection.empty) {
      bookingsByDayCollection.forEach(({ id }) => {
        batch.delete(bookingsByDayRef.doc(id));
      });
    }
    functions.logger.log(
      "All 'bookingsByDay' successfully enqueued for deletion"
    );
  } catch (error) {
    functions.logger.error(error);
  }
};

const enqueueCustomersMigrations: EnqueueMigration = async ({
  batch,
  orgRef,
}) => {
  try {
    functions.logger.log("Processing customers");

    const customersRef = orgRef.collection(
      DeprecatedOrgSubCollection.Customers
    );

    const customersCollection = await customersRef.get();

    if (!customersCollection.empty) {
      customersCollection.forEach((customerSnapshot) => {
        const { id } = customerSnapshot;
        const customer = customerSnapshot.data();
        // check if customer needs updating
        if (customer.secret_key) {
          const { secret_key: secretKey, ...customerData } = customer;
          batch.set(customersRef.doc(id), {
            ...customerData,
            secretKey,
          });
        }
      });
    }
    functions.logger.log("Customers successfully enqueued for migration");
  } catch (error) {
    functions.logger.error(error);
  }
};

const enqueueBookingsMigrations: EnqueueMigration = async ({
  batch,
  orgRef,
}) => {
  try {
    const bookingsRef = orgRef.collection(DeprecatedOrgSubCollection.Bookings);

    const bookingsCollection = await bookingsRef.get();

    if (!bookingsCollection.empty) {
      functions.logger.log("Processing bookings");

      const customerBookingUpdates = bookingsCollection.docs.map(
        (customerBooking) =>
          // here we're returning a self calling function (which, in effect, results of an async forEach function as promises)
          (async () => {
            const { id: secretKey } = customerBooking;
            const customerBookingsRef = bookingsRef.doc(secretKey);

            // check if customers booking info needs migrating
            const customerInfo =
              customerBooking.data() as Partial<DeprecatedBookingsMeta> &
                Partial<CustomerBase>;
            if (customerInfo.customer_id) {
              const { customer_id: id, ...custoemrData } =
                customerInfo as DeprecatedBookingsMeta;
              const customerBase: CustomerBase = { ...custoemrData, id };
              batch.set(customerBookingsRef, customerBase);
            }

            // check bookings for customer and delete all stale bookings
            const staleBookings = await customerBookingsRef
              .collection("data")
              .get();
            if (!staleBookings.empty) {
              staleBookings.forEach(({ id }) => {
                batch.delete(customerBookingsRef.collection("data").doc(id));
              });
            }
          })()
      );
      await Promise.all(customerBookingUpdates);
      functions.logger.log("Bookings successfully enqueued for migration");
    }
  } catch (error) {
    functions.logger.error(error);
  }
};
// #endregion migrateToNewDataModel

// #region addIdsToCustomers
/**
 * A simple migration used to manually include customer id (document id)
 * in the customer structure (this is currently done by the data trigger)
 */
export const addIdsToCustomers = functions
  .region(__functionsZone__)
  .https.onCall(async ({ organization }) => {
    try {
      const db = admin.firestore();

      // get all customers
      const customerDocs = await db
        .collection(Collection.Organizations)
        .doc(organization)
        .collection(OrgSubCollection.Customers)
        .get();

      const updates: Promise<any>[] = [];

      customerDocs.forEach((customerSnapshot) => {
        const data = customerSnapshot.data();
        if (!data.id) {
          updates.push(
            customerSnapshot.ref.set(
              { id: customerSnapshot.id },
              { merge: true }
            )
          );
        }
      });

      await Promise.all(updates);

      return { success: true };
    } catch (err) {
      functions.logger.error(err);
      return { success: false };
    }
  });
// #endregion addIdsToCustomers
