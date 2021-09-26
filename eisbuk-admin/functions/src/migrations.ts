import * as functions from "firebase-functions";
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
  .https.onCall(async ({ organization }: { organization: string }, context) => {
    await checkUser(organization, context.auth);

    const org = admin
      .firestore()
      .collection(Collection.Organizations)
      .doc(organization);

    // get all collections needing of pruning
    const [
      slotsColl,
      bookingsColl,
      bookingsByDayColl,
      customersColl,
    ] = await Promise.all(
      [
        DeprecatedOrgSubCollection.Slots,
        DeprecatedOrgSubCollection.Bookings,
        DeprecatedOrgSubCollection.BookingsByDay,
        DeprecatedOrgSubCollection.Customers,
      ].map((collString) => org.collection(collString).get())
    );

    // create an array of operations for concurrent dispatch
    const operations: Promise<any>[] = [];

    // `slots` and `slotsByDay`
    // we're removing all of the `slots` entries belonging to the deprecated data model
    // `slotsByDay` will get removed automatically through aggregateSlots
    if (!slotsColl.empty) {
      slotsColl.forEach((slotSnapshot) => {
        const slot = slotSnapshot.data();
        // check deprecated and queue for deletion
        if (Object.keys(slot).includes("durations")) {
          operations.push(
            org
              .collection(DeprecatedOrgSubCollection.Slots)
              .doc(slot.id)
              .delete()
          );
        }
      });
    }

    // `bookings`
    // we're removing all of the `bookings` entries belonging to the deprecated data model
    if (!bookingsColl.empty) {
      bookingsColl.forEach(async (customerBooking) => {
        const { id: secretKey } = customerBooking;
        const customerBookingsRef = org
          .collection(DeprecatedOrgSubCollection.Bookings)
          .doc(secretKey);

        // check if customers booking info need migrating
        const customerInfo = customerBooking as Partial<DeprecatedBookingsMeta> &
          Partial<CustomerBase>;
        if (customerInfo.customer_id) {
          const {
            customer_id: id,
            ...custoemrData
          } = customerInfo as DeprecatedBookingsMeta;
          const customerBase: CustomerBase = { ...custoemrData, id };
          // queue updates
          operations.push(customerBookingsRef.set(customerBase));
        }

        // check bookings for customer
        const staleBookings = await customerBookingsRef
          .collection("data")
          .get();
        // delete all stale bookings
        if (!staleBookings.empty) {
          staleBookings.forEach(({ id }) =>
            operations.push(
              customerBookingsRef.collection("data").doc(id).delete()
            )
          );
        }
      });
    }

    // `bookingsByDay`
    // normally, `bookginsByDay` would have been removed by the same dataTrigger used to create them
    // however, we're deprecating `bookingsByDay` entries altogether, rendering `aggregateBookings` data trigger obsolete
    // and removing said data trigger not to cause problems in the future
    if (!bookingsByDayColl.empty) {
      bookingsByDayColl.forEach(({ id }) =>
        operations.push(
          org
            .collection(DeprecatedOrgSubCollection.BookingsByDay)
            .doc(id)
            .delete()
        )
      );
    }

    // `customers`
    // we're only migrating the `secret_key` to `secretKey`
    if (!customersColl.empty) {
      customersColl.forEach((customerSnapshot) => {
        const { id } = customerSnapshot;
        const customer = customerSnapshot.data();
        // check if customer needs updating
        if (customer.secret_key) {
          const { secret_key: secretKey, ...customerData } = customer;
          operations.push(
            org
              .collection(OrgSubCollection.Customers)
              .doc(id)
              .set({ ...customerData, secretKey })
          );
        }
      });
    }

    await Promise.all(operations);
  });
