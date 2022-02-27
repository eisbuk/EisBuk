import * as functions from "firebase-functions";
import { FieldValue } from "@google-cloud/firestore";
import admin from "firebase-admin";

import { Collection, OrgSubCollection, SlotType } from "eisbuk-shared";
import { DeprecatedSlotType } from "eisbuk-shared/dist/deprecated";

import { __functionsZone__ } from "./constants";

import { checkUser } from "./utils";

/**
 * Goes through all 'slotsByDay' entries, checks each date to see if there are no slots in the day and deletes the day if empty.
 * If all days are empty, deletes the entry (for a month) altogether.
 */
export const pruneSlotsByDay = functions
  .region(__functionsZone__)
  .https.onCall(
    async ({ organization }: { organization: string }, { auth }) => {
      await checkUser(organization, auth);

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
    await checkUser(organization, auth);

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

/**
 * Replaces all deprecated "off-ice-dancing" and "off-ice-gym" slot type entries
 * with unified "off-ice" type
 */
export const unifyOffIceLabels = functions
  .region("europe-west6")
  .https.onCall(async ({ organization }, { auth }) => {
    checkUser(organization, auth);

    const firestore = admin.firestore();
    const batch = firestore.batch();
    // get all off-ice-* slots
    const slotsRef = firestore
      .collection(Collection.Organizations)
      .doc(organization)
      .collection(OrgSubCollection.Slots);
    const offIceSlots = await slotsRef
      .where("type", "in", [
        DeprecatedSlotType.OffIceDancing,
        DeprecatedSlotType.OffIceGym,
      ])
      .get();
    // replace all type entries with unified "off-ice"
    offIceSlots.forEach((snap) => {
      const { ref } = snap;
      batch.set(ref, { type: SlotType.OffIce }, { merge: true });
    });
    await batch.commit();
    return { success: true };
  });
