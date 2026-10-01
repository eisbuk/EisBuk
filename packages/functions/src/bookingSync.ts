import admin from "firebase-admin";
import _ from "lodash";

import {
  BookingSubCollection,
  Collection,
  CustomerAttendance,
  CustomerBookingEntry,
  CustomerBookings,
  OrgSubCollection,
  SlotAttendnace,
  SlotBookingsCounts,
} from "@eisbuk/shared";

/**
 * Data derived from athletes' bookings (`slotBookingsCounts` and the booked part of `attendance`)
 * is kept in sync by the functions in this module.
 *
 * First generation Firestore triggers are delivered at least once, in no particular order, and can run
 * concurrently. Applying the change described by the event (+1/-1, the interval from the event payload) is
 * therefore wrong whenever an event is processed twice or after a newer one. Instead, each function here
 * re-reads the current booking data inside a transaction and writes the derived value from it. Running any of
 * them again, at any time, for any reason, converges to the same result: the triggers and the repair
 * (reconciliation) use the same functions.
 */

type Firestore = admin.firestore.Firestore;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;

interface SyncOptions {
  /** Compute the result without writing anything */
  dryRun?: boolean;
}

export interface SyncResult<T> {
  before: T;
  after: T;
  changed: boolean;
}

const getOrgRef = (db: Firestore, organization: string) =>
  db.collection(Collection.Organizations).doc(organization);

const isInOrganization = (organization: string) => (doc: DocumentSnapshot) =>
  doc.ref.path.startsWith(
    `${Collection.Organizations}/${organization}/${OrgSubCollection.Bookings}/`
  );

/**
 * Bookings of all athletes for a date range, across organizations (filter with `isInOrganization`).
 *
 * Requires a single field index with collection group scope on `bookedSlots.date` (see `firestore.indexes.json`).
 */
const queryBookedSlots = (db: Firestore, from: string, to = from) =>
  db
    .collectionGroup(BookingSubCollection.BookedSlots)
    .where("date", ">=", from)
    .where("date", "<=", to);

// #region slotBookingsCounts
/**
 * Recounts the bookings for a slot and stores the number in `slotBookingsCounts/{YYYY-MM}.{slotId}`.
 *
 * The bookings are read inside the same transaction that reads and writes the counter document, so concurrent
 * recounts are serialised by the counter and the last one to commit has seen every booking committed before it.
 *
 * @param date the date of the slot (and its bookings): we count the bookings with this date
 */
export const syncSlotBookingsCount = (
  db: Firestore,
  organization: string,
  slotId: string,
  date: string,
  { dryRun = false }: SyncOptions = {}
): Promise<SyncResult<number | undefined>> => {
  const countsRef = getOrgRef(db, organization)
    .collection(OrgSubCollection.SlotBookingsCounts)
    .doc(date.substring(0, 7));

  return db.runTransaction(async (tx) => {
    const countsSnap = await tx.get(countsRef);
    const bookings = await tx.get(queryBookedSlots(db, date));

    const before = (countsSnap.data() as SlotBookingsCounts | undefined)?.[
      slotId
    ];
    const after = bookings.docs
      .filter(isInOrganization(organization))
      .filter((doc) => doc.id === slotId).length;

    const changed = before !== after;
    if (changed && !dryRun) {
      tx.set(countsRef, { [slotId]: after }, { merge: true });
    }

    return { before, after, changed };
  });
};

/**
 * Recounts the bookings for every slot in a month and fixes the counters that differ
 * (including counters of slots that have no bookings at all).
 *
 * @param month "YYYY-MM"
 * @returns before/after values of the counters that differ (all of them are written, unless `dryRun`)
 */
export const syncMonthBookingsCounts = (
  db: Firestore,
  organization: string,
  month: string,
  { dryRun = false }: SyncOptions = {}
): Promise<Record<string, SyncResult<number | undefined>>> => {
  const countsRef = getOrgRef(db, organization)
    .collection(OrgSubCollection.SlotBookingsCounts)
    .doc(month);

  return db.runTransaction(async (tx) => {
    const countsSnap = await tx.get(countsRef);
    const bookings = await tx.get(
      queryBookedSlots(db, `${month}-01`, `${month}-31`)
    );

    const stored = (countsSnap.data() || {}) as SlotBookingsCounts;
    const actual = bookings.docs
      .filter(isInOrganization(organization))
      .reduce(
        (acc, { id }) => ({ ...acc, [id]: (acc[id] || 0) + 1 }),
        {} as SlotBookingsCounts
      );

    const changes: Record<string, SyncResult<number | undefined>> = {};
    for (const slotId of new Set([
      ...Object.keys(stored),
      ...Object.keys(actual),
    ])) {
      const before = stored[slotId];
      const after = actual[slotId] || 0;
      if (before !== after) {
        changes[slotId] = { before, after, changed: true };
      }
    }

    if (Object.keys(changes).length && !dryRun) {
      tx.set(
        countsRef,
        _.mapValues(changes, ({ after }) => after),
        { merge: true }
      );
    }

    return changes;
  });
};
// #endregion slotBookingsCounts

// #region attendance
/**
 * Derives an athlete's attendance entry for a slot from their current booking (if any) and the current entry.
 *
 * The admin attendance screen only changes `attendedInterval` (or adds attendance for athletes who haven't booked,
 * with `bookedInterval: null`). On booking, `attendedInterval` is initialised to the booked interval, so while the
 * two are equal, `attendedInterval` holds the automatic value and follows the booking. Once they differ (the admin
 * recorded a different interval, or `null` for absence), it's the admin's record and is never overwritten here.
 *
 * Limitation: an admin confirming attendance with exactly the booked interval can't be told apart from the
 * automatic value (the data model doesn't record who set it), so in that case it follows the booking too.
 *
 * @returns the entry to store, or `undefined` if there should be no entry
 */
export const deriveAttendanceEntry = (
  booking: CustomerBookingEntry | undefined,
  current: CustomerAttendance | undefined
): CustomerAttendance | undefined => {
  const isAutomatic =
    !current || current.attendedInterval === current.bookedInterval;

  if (!booking) {
    // Attendance recorded by the admin for an athlete who hadn't booked: not derived from bookings
    if (!current || !current.bookedInterval) return current;
    // Booking cancelled: the automatic value goes with it, and so does an absence (no booking, no attendance)
    if (isAutomatic || !current.attendedInterval) return undefined;
    // Booking cancelled after the admin recorded attendance: keep the attendance, without the booking
    return { bookedInterval: null, attendedInterval: current.attendedInterval };
  }

  const entry: CustomerAttendance = {
    bookedInterval: booking.interval,
    attendedInterval: isAutomatic
      ? booking.interval
      : current!.attendedInterval,
  };
  if (booking.bookingNotes) {
    entry.bookingNotes = booking.bookingNotes;
  }
  return entry;
};

/**
 * Brings an athlete's attendance entry for a slot in line with their current booking (see `deriveAttendanceEntry`).
 *
 * Reads the booking, the athlete's bookings document (for the customer id) and the slot's attendance in one
 * transaction, so the result doesn't depend on which event triggered the sync, or how many times.
 *
 * @param secretKey the athlete's bookings document id
 * @returns `null` if the athlete's bookings document or the slot can't be found (nothing written):
 * without them we can't tell whether the athlete booked, so the entry is left as it is
 */
export const syncAttendanceEntry = (
  db: Firestore,
  organization: string,
  slotId: string,
  secretKey: string,
  { dryRun = false }: SyncOptions = {}
): Promise<
  (SyncResult<CustomerAttendance | undefined> & { customerId: string }) | null
> => {
  const orgRef = getOrgRef(db, organization);
  const bookingsRef = orgRef
    .collection(OrgSubCollection.Bookings)
    .doc(secretKey);
  const attendanceRef = orgRef
    .collection(OrgSubCollection.Attendance)
    .doc(slotId);

  return db.runTransaction(async (tx) => {
    const [attendanceSnap, bookingsSnap, bookingSnap] = await tx.getAll(
      attendanceRef,
      bookingsRef,
      bookingsRef.collection(BookingSubCollection.BookedSlots).doc(slotId)
    );

    const id = (bookingsSnap.data() as CustomerBookings | undefined)?.id;
    if (!id) return null;

    // The attendance document is created (with the slot's date) when the slot is created, and deleted with the slot.
    // If the booking is processed first, create it here, but never for a slot that doesn't exist.
    let slotDate: string | undefined;
    if (!attendanceSnap.exists) {
      const slotSnap = await tx.get(
        orgRef.collection(OrgSubCollection.Slots).doc(slotId)
      );
      if (!slotSnap.exists) return null;
      slotDate = slotSnap.data()!.date;
    }

    const booking = bookingSnap.data() as CustomerBookingEntry | undefined;
    const before = (attendanceSnap.data() as SlotAttendnace | undefined)
      ?.attendances?.[id];
    const after = deriveAttendanceEntry(booking, before);

    const changed = !_.isEqual(before, after);
    if (changed && !dryRun) {
      if (slotDate) {
        tx.set(attendanceRef, {
          date: slotDate,
          attendances: { [id]: after! },
        } as SlotAttendnace);
      } else {
        tx.update(
          attendanceRef,
          new admin.firestore.FieldPath("attendances", id),
          after || admin.firestore.FieldValue.delete()
        );
      }
    }

    return { customerId: id, before, after, changed };
  });
};
// #endregion attendance
