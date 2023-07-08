import * as functions from "firebase-functions";
import { FieldValue } from "@google-cloud/firestore";
import admin from "firebase-admin";

import {
  Collection,
  OrgSubCollection,
  defaultEmailTemplates,
  OrganizationData,
  CustomerFull,
  isValidPhoneNumber,
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

        return { success: true };
      } catch (error) {
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

export const populateDefaultEmailTemplates = functions
  .region(__functionsZone__)
  .https.onCall(async ({ organization }, { auth }) => {
    if (!(await checkUser(organization, auth))) throwUnauth();

    const batch = admin.firestore().batch();

    const allOrgs = await admin
      .firestore()
      .collection(Collection.Organizations)
      .get();

    allOrgs.forEach((organization) => {
      const data = organization.data() as OrganizationData;

      // templates already exist => return
      if (data.emailTemplates && data.emailTemplates.length) return;

      functions.logger.info(`Populated organization: ${data.displayName}`);

      batch.set(organization.ref, {
        ...data,
        emailTemplates: defaultEmailTemplates,
      });
    });

    await batch.commit();

    return { success: true };
  });

export const removeInvalidCustomerPhones = functions
  .region(__functionsZone__)
  .https.onCall(
    async ({ organization }: { organization: string }, { auth }) => {
      if (!(await checkUser(organization, auth))) throwUnauth();

      const db = admin.firestore();

      const batch = db.batch();

      const custoemrs = await db
        .collection(Collection.Organizations)
        .doc(organization)
        .collection(OrgSubCollection.Customers)
        .get();

      custoemrs.forEach((customer) => {
        const data = customer.data() as CustomerFull;
        if (!data.phone) return;

        const { phone } = data;

        if (!isValidPhoneNumber(phone)) {
          batch.set(
            customer.ref,
            { phone: admin.firestore.FieldValue.delete() },
            { merge: true }
          );
        }
      });

      await batch.commit();

      return { success: true };
    }
  );
