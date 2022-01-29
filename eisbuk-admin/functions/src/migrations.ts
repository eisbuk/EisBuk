import * as functions from "firebase-functions";
import {
  WriteBatch,
  DocumentReference,
  DocumentData,
  FieldValue,
} from "@google-cloud/firestore";
import admin from "firebase-admin";
import _ from "lodash";

import {
  Category,
  Collection,
  CustomerBase,
  OrgSubCollection,
} from "eisbuk-shared";
import {
  DeprecatedOrgSubCollection,
  DeprecatedBookingsMeta,
} from "eisbuk-shared/dist/deprecated";

import { checkUser } from "./utils";

/**
 * Migrates slot entries to struct containing plural 'categories' instead of single 'category'
 */
export const migrateSlotsToPluralCategories = functions
  .region("europe-west6")
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

/**
 * Deletes all entries in firestore, related to the old data model
 */
export const migrateToNewDataModel = functions
  .region("europe-west6")
  .https.onCall(async ({ organization }: { organization: string }) => {
    try {
      // await checkUser(organization, context.auth);
      functions.logger.log("Started migration to new data model");

      const db = admin.firestore();
      const batch = db.batch();
      const orgRef = db.collection(Collection.Organizations).doc(organization);

      // list of migration handlers (promises) we're using to await all before commiting batch
      const migrations = [
        // `slots` and `slotsByDay`
        // we're removing all of the `slots` entries belonging to the deprecated data model
        // `slotsByDay` will get removed automatically through aggregateSlots
        enqueueSlotMigrations({ orgRef, batch }),

        // `bookings`
        // we're removing all of the `bookings` entries belonging to the deprecated data model
        enqueueBookingsMigrations({ orgRef, batch }),

        // `bookingsByDay`
        // normally, `bookingsByDay` would have been removed by the same dataTrigger used to create them
        // however, we're deprecating `bookingsByDay` entries altogether, rendering `aggregateBookings` data trigger obsolete
        // and removing said data trigger not to cause problems in the future
        enqueueBookingsByDayDeletion({ orgRef, batch }),

        // `customers`
        // we're only migrating the `secret_key` to `secretKey`
        enqueueCustomersMigrations({ orgRef, batch }),
      ];

      // wait for all of the migrations to be batched up before commiting a batch
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

/**
 * Enqueues deletion of old data model slots (having `duration` instead of `intervals`) to provided write batch.
 */
const enqueueSlotMigrations: EnqueueMigration = async ({ batch, orgRef }) => {
  try {
    functions.logger.log("Processing slots");

    // slots collection ref
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

/**
 * Enqueues deletion of all 'bookingsByDay' entries (deprecated collection) to provided write batch.
 */
const enqueueBookingsByDayDeletion: EnqueueMigration = async ({
  batch,
  orgRef,
}) => {
  try {
    functions.logger.log("Enqueueing all 'bookingsByDay' for deletion");

    // bookingsByDay collection ref
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

/**
 * Enqueues migration of all 'customers' entries (`secret_key` => `secretKey`) to provided write batch.
 */
const enqueueCustomersMigrations: EnqueueMigration = async ({
  batch,
  orgRef,
}) => {
  try {
    functions.logger.log("Processing customers");

    // customers collection ref
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

/**
 * Enqueues `bookings` collection migrations (from old data model) to provided write batch.
 * Migrations:
 * - migrating bookings[secretKey] from `BookingsMeta` to `CustomerBase` (`customer_id` -> `id`)
 * - deleting all of `"data"` collection entries as the new booking entries are stored in `"bookedSlots"`
 */
const enqueueBookingsMigrations: EnqueueMigration = async ({
  batch,
  orgRef,
}) => {
  try {
    // customers collection ref
    const bookingsRef = orgRef.collection(DeprecatedOrgSubCollection.Bookings);

    const bookingsCollection = await bookingsRef.get();

    if (!bookingsCollection.empty) {
      functions.logger.log("Processing bookings");

      // we're storing migrations for each customer's booking entry as a promise
      // resulting as a list of promises, which we can the await as a group
      const customerBookingUpdates = bookingsCollection.docs.map(
        (customerBooking) =>
          // here we're returning a self calling function (and in effect results of an async forEach function as promises)
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
              // queue updates
              batch.set(customerBookingsRef, customerBase);
            }

            // check bookings for customer
            const staleBookings = await customerBookingsRef
              .collection("data")
              .get();
            // delete all stale bookings
            if (!staleBookings.empty) {
              staleBookings.forEach(({ id }) => {
                batch.delete(customerBookingsRef.collection("data").doc(id));
              });
            }
          })()
      );
      // we're awaiting the group so that the function is not resolved before all migrations are enqueued in write batch
      await Promise.all(customerBookingUpdates);
      functions.logger.log("Bookings successfully enqueued for migration");
    }
  } catch (error) {
    functions.logger.error(error);
  }
};

/**
 * Goes through all 'slotsByDay' entries, checks each date to see if there are no slots in the day and deletes the day if empty.
 * If all days are empty, deletes the entry (for a month) altogether.
 */
export const pruneSlotsByDay = functions
  .region("europe-west6")
  .https.onCall(async ({ organization }: { organization: string }) => {
    try {
      const db = admin.firestore();
      const batch = db.batch();

      // refernce to an organization entry we're migrating
      const slotsByDayRef = db
        .collection(Collection.Organizations)
        .doc(organization)
        .collection(OrgSubCollection.SlotsByDay);

      // get entire slotsByDay collection
      const slotsByDay = await slotsByDayRef.get();

      // exit early if 'slotsByDay' doesn't exist
      if (slotsByDay.empty) {
        functions.logger.log("No 'slotsByDay' found");
        return { success: true };
      }

      // go through each document and check dates/slots
      slotsByDay.forEach((monthSnapshot) => {
        const monthRef = slotsByDayRef.doc(monthSnapshot.id);

        const monthEntry = monthSnapshot.data();
        const dates = Object.keys(monthEntry);

        // a countdown counter, starting from num days and decremented on each day entry deletion
        // used to determine whether to update the month record with deleted entries or delete the record altogether
        let nonEmptySlots = dates.length;

        // updated month record with delete sentinels as values for days to delete
        const updatedRecord = dates.reduce((acc, date) => {
          const dayEntry = monthEntry[date];
          // check the dateEntry for slots
          if (!Object.values(dayEntry).length) {
            nonEmptySlots--;
            return { ...acc, [date]: FieldValue.delete() };
          }
          return { ...acc, [date]: dayEntry };
        }, {} as Record<string, FieldValue>);

        // if there are non empty slots, update the record with deleted entries
        // if there are no slots in the entire month, delete the month entry altogether
        if (nonEmptySlots) {
          batch.set(monthRef, updatedRecord, { merge: true });
        } else {
          batch.delete(monthRef);
        }
      });

      await batch.commit();

      functions.logger.log("Successfully pruned 'slotsByDay'");

      return { success: true };
    } catch (error) {
      functions.logger.error(error);
      return { success: false };
    }
  });

export const addIdsToCustomers = functions
  .region("europe-west6")
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
