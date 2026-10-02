import admin from "firebase-admin";
import _ from "lodash";
import { DateTime } from "luxon";
import {
  BookingSubCollection,
  Collection,
  CustomerBookingEntry,
  CustomerFull,
  OrgSubCollection,
  SlotInterface,
  SlotType,
  calculateIntervalDuration,
} from "@eisbuk/shared";

import { BookingCandidate, selectBooking } from "./bookingSync";

type Firestore = admin.firestore.Firestore;

export const getStatsDates = (...dates: unknown[]): string[] =>
  [...new Set(dates)].filter(
    (date): date is string =>
      typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      DateTime.fromISO(date).isValid
  );

/** Recalculates one customer's month from current bookings and source slots in a transaction. */
export const syncCustomerBookingStats = (
  db: Firestore,
  organization: string,
  customerId: string,
  month: string
) => {
  const org = db.collection(Collection.Organizations).doc(organization);
  const customerRef = org
    .collection(OrgSubCollection.Customers)
    .doc(customerId);
  return db.runTransaction(async (tx) => {
    const customer = (await tx.get(customerRef)).data() as
      | CustomerFull
      | undefined;
    if (!customer) return;
    const mirrors = await tx.get(
      org.collection(OrgSubCollection.Bookings).where("id", "==", customerId)
    );
    const bookings = await Promise.all(
      mirrors.docs.map((mirror) =>
        tx.get(
          mirror.ref
            .collection(BookingSubCollection.BookedSlots)
            .where("date", ">=", `${month}-01`)
            .where("date", "<=", `${month}-31`)
        )
      )
    );
    const candidates = new Map<string, BookingCandidate[]>();
    bookings.forEach((snapshot, index) => {
      snapshot.docs.forEach((doc) => {
        const booking = doc.data() as CustomerBookingEntry;
        if (!getStatsDates(booking.date).length) return;
        const entries = candidates.get(doc.id) || [];
        entries.push({
          secretKey: mirrors.docs[index].id,
          booking,
          updateTime: doc.updateTime.toMillis(),
        });
        candidates.set(doc.id, entries);
      });
    });
    const selected = [...candidates].map(([id, entries]) => ({
      id,
      booking: selectBooking(entries, customer.secretKey)!.booking,
    }));
    const slots = await Promise.all(
      selected.map(({ id }) =>
        tx.get(org.collection(OrgSubCollection.Slots).doc(id))
      )
    );
    const stats = { [SlotType.Ice]: 0, [SlotType.OffIce]: 0 };
    selected.forEach(({ booking }, index) => {
      const slot = slots[index].data() as SlotInterface | undefined;
      if (!slot || slot.date !== booking.date || !(slot.type in stats)) return;
      stats[slot.type] += calculateIntervalDuration(booking.interval);
    });
    if (!_.isEqual(customer.bookingStats?.[month], stats)) {
      tx.update(customerRef, { [`bookingStats.${month}`]: stats });
    }
  });
};

/** Finds customers whose booked hours are affected by a source slot edit or deletion. */
export const syncCustomerStatsForSlot = async (
  db: Firestore,
  organization: string,
  slotId: string,
  dates: string[]
) => {
  if (!dates.length) return;
  const orgPath = `${Collection.Organizations}/${organization}`;
  const bookings = await db
    .collectionGroup(BookingSubCollection.BookedSlots)
    .where("date", "in", dates)
    .get();
  const mirrorRefs = new Map<string, admin.firestore.DocumentReference>();
  bookings.docs.forEach((doc) => {
    const mirror = doc.ref.parent.parent!;
    if (doc.id === slotId && mirror.parent.parent?.path === orgPath) {
      mirrorRefs.set(mirror.path, mirror);
    }
  });
  const mirrors = await Promise.all(
    [...mirrorRefs.values()].map((ref) => ref.get())
  );
  const ids = new Set(
    mirrors
      .map((mirror) => mirror.data()?.id)
      .filter((id): id is string => typeof id === "string" && Boolean(id))
  );
  const months = new Set(dates.map((date) => date.substring(0, 7)));
  await Promise.all(
    [...ids].flatMap((id) =>
      [...months].map((month) =>
        syncCustomerBookingStats(db, organization, id, month)
      )
    )
  );
};
