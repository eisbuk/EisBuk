import * as functions from "firebase-functions";
import { FieldValue } from "@google-cloud/firestore";
import admin from "firebase-admin";

import {
  Category,
  Collection,
  DeprecatedCategory,
  OrgSubCollection,
  SlotInterface,
  CategoryUnion,
  Customer,
} from "@eisbuk/shared";

import { __functionsZone__ } from "./constants";

import { checkUser, throwUnauth } from "./utils";

/**
 * Goes through all 'slotsByDay' entries, checks each date to see if there are no slots in the day and deletes the day if empty.
 * If all days are empty, deletes the entry (for a month) altogether.
 */
export const pruneSlotsByDay = functions
  .region(__functionsZone__)
  .https.onCall(
    async ({ organization }: { organization: string }, { auth }) => {
      if (!(await checkUser(organization, auth))) throwUnauth();

      try {
        const db = admin.firestore();
        const batch = db.batch();

        const slotsByDayRef = db
          .collection(Collection.Organizations)
          .doc(organization)
          .collection(OrgSubCollection.SlotsByDay);

        const slotsByDay = await slotsByDayRef.get();

        if (slotsByDay.empty) {
          functions.logger.log("No 'slotsByDay' found");
          return { success: true };
        }

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
    }
  );

/**
 * Deletes old bookings without corresponding customers
 */
export const deleteOrphanedBookings = functions
  .region("europe-west6")
  .https.onCall(async ({ organization }, { auth }) => {
    if (!(await checkUser(organization, auth))) throwUnauth();

    const orgRef = admin
      .firestore()
      .collection(Collection.Organizations)
      .doc(organization);

    // get all customers and bookings
    const allCustomers = await orgRef
      .collection(OrgSubCollection.Customers)
      .get();
    const customerIds = allCustomers.docs.map(({ id }) => id);
    const bookingsRef = orgRef.collection(OrgSubCollection.Bookings);
    const allBookings = await bookingsRef.get();

    const toDelete: Promise<any>[] = [];
    allBookings.forEach((doc) => {
      const { id } = doc.data();
      // delete only the bookings without corresponding customer
      if (!customerIds.includes(id)) {
        toDelete.push(doc.ref.delete());
      }
    });

    await Promise.all(toDelete);
    return { success: true };
  });

export const migrateCategoriesToExplicitMinors = functions
  .region(__functionsZone__)
  .https.onCall(async ({ organization }, { auth }) => {
    if (!(await checkUser(organization, auth))) throwUnauth();

    const batch = admin.firestore().batch();

    const orgRef = admin
      .firestore()
      .collection(Collection.Organizations)
      .doc(organization);
    const slotsRef = orgRef.collection(OrgSubCollection.Slots);
    const customersRef = orgRef.collection(OrgSubCollection.Customers);

    const [allSlots, allCustomers] = await Promise.all([
      slotsRef.get(),
      customersRef.get(),
    ]);

    // Enqueue slot updates
    allSlots.forEach((slot) => {
      const updatedCategories: CategoryUnion[] = [];

      const data = slot.data() as SlotInterface;
      const categories = data.categories as CategoryUnion[];

      // Update slot only if needed: if at least one of the categories needs updating
      let shouldUpdate = false;
      categories.forEach((c) => {
        let category = c;
        switch (category) {
          case DeprecatedCategory.Course:
            category = Category.CourseMinors;
            shouldUpdate = true;
            break;
          case DeprecatedCategory.PreCompetitive:
            category = Category.PreCompetitiveMinors;
            shouldUpdate = true;
            break;
          default:
        }
        // Avoid duplicating of the categories
        if (!updatedCategories.includes(category)) {
          updatedCategories.push(category);
        }
      });

      if (shouldUpdate) {
        batch.set(slot.ref, { categories: updatedCategories }, { merge: true });
      }
    });

    // Enqueue customer updates
    allCustomers.forEach((customer) => {
      const data = customer.data() as Customer;
      const categories = data.categories as CategoryUnion[];

      categories.forEach((category, i) => {
        switch (category) {
          case DeprecatedCategory.Course:
            categories[i] = Category.CourseMinors;
            break;
          case DeprecatedCategory.PreCompetitive:
            categories[i] = Category.PreCompetitiveMinors;
            break;
          default:
            // No changes needed, no updates batched
            return;
        }
      });

      batch.set(customer.ref, { categories }, { merge: true });
    });

    await batch.commit();

    return { success: true };
  });

export const customersToPluralCategories = functions
  .region(__functionsZone__)
  .https.onCall(async ({ organization }, { auth }) => {
    if (!(await checkUser(organization, auth))) throwUnauth();

    const batch = admin.firestore().batch();

    const orgRef = admin
      .firestore()
      .collection(Collection.Organizations)
      .doc(organization);
    const customersRef = orgRef.collection(OrgSubCollection.Customers);

    const allCustomers = await customersRef.get();

    allCustomers.forEach((customer) => {
      const data = customer.data();

      if (!data.category) return;
      const { category, ...noCategoryData } = data;
      if (!Array.isArray(category)) {
        functions.logger.info(`Converted customer: ${data.id}`);

        batch.set(customer.ref, { ...noCategoryData, categories: [category] });
      } else {
        batch.set(customer.ref, { ...noCategoryData, categories: category });
      }
    });

    await batch.commit();

    return { success: true };
  });
