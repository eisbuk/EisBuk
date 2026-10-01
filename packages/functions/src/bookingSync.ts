import {
  DocumentSnapshot,
  FieldPath,
  FieldValue,
  Firestore,
} from "@google-cloud/firestore";
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
 * On booking, `attendedInterval` is initialised to the booked interval: while the entry is booked and the two are
 * equal, `attendedInterval` holds this automatic value and follows the booking. Anything else was recorded by the
 * admin (a different interval, `null` for absence, or attendance of an athlete who hadn't booked) and
 * `attendedInterval` is never changed here:
 * - booking changed: `bookedInterval` follows the booking, `attendedInterval` is kept
 * - booking cancelled: an automatic entry is removed; an entry recorded by the admin is kept with
 *   `bookedInterval: null` (absence included: `{ bookedInterval: null, attendedInterval: null }`), so a later booking
 *   finds the admin's record whatever order the events are processed in
 *
 * Limitation: an admin confirming attendance with exactly the booked interval can't be told apart from the
 * automatic value (the data model doesn't record who set it), so in that case it follows the booking too.
 *
 * With `bookedPartOnly`, only `bookedInterval` of an existing entry is updated: entries aren't added or removed and
 * the rest of the entry is kept as it is. The reconciliation uses this for past lessons, where `attendedInterval`
 * may be the club's record of the lesson even when equal to the booked interval.
 *
 * @returns the entry to store, or `undefined` if there should be no entry
 */
export const deriveAttendanceEntry = (
  booking: CustomerBookingEntry | undefined,
  current: CustomerAttendance | undefined,
  { bookedPartOnly = false }: { bookedPartOnly?: boolean } = {}
): CustomerAttendance | undefined => {
  if (bookedPartOnly) {
    if (!booking || !current) return current;
    return { ...current, bookedInterval: booking.interval };
  }

  const isAutomatic =
    !current ||
    (Boolean(current.bookedInterval) &&
      current.attendedInterval === current.bookedInterval);

  if (!booking) {
    if (isAutomatic) return undefined;
    return {
      bookedInterval: null,
      attendedInterval: current!.attendedInterval,
    };
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
 * The ids of all bookings documents of a customer. A customer can have more than one (secret key changed), and
 * a booking under any of them counts.
 */
export const getSecretKeys = (
  db: Firestore,
  organization: string,
  customerId: string
): Promise<string[]> =>
  getOrgRef(db, organization)
    .collection(OrgSubCollection.Bookings)
    .where("id", "==", customerId)
    .get()
    .then(({ docs }) => docs.map(({ id }) => id));

/**
 * Brings an athlete's attendance entry for a slot in line with their current booking (see `deriveAttendanceEntry`).
 *
 * Reads the athlete's bookings documents (for the customer id), their booking for the slot under each of them, and
 * the slot's attendance in one transaction, so the result doesn't depend on which event triggered the sync, or how
 * many times.
 *
 * @param secretKeys the athlete's bookings document ids (see `getSecretKeys`); a booking under any of them counts
 * @returns `null` if none of the bookings documents (or the slot) can be found, or they belong to different
 * customers (nothing written): without them we can't tell whether the athlete booked
 */
export const syncAttendanceEntry = (
  db: Firestore,
  organization: string,
  slotId: string,
  secretKeys: string[],
  {
    dryRun = false,
    bookedPartOnly = false,
  }: SyncOptions & { bookedPartOnly?: boolean } = {}
): Promise<
  (SyncResult<CustomerAttendance | undefined> & { customerId: string }) | null
> => {
  const orgRef = getOrgRef(db, organization);
  const bookingsRefs = [...new Set(secretKeys)].map((secretKey) =>
    orgRef.collection(OrgSubCollection.Bookings).doc(secretKey)
  );
  const attendanceRef = orgRef
    .collection(OrgSubCollection.Attendance)
    .doc(slotId);

  if (!bookingsRefs.length) return Promise.resolve(null);

  return db.runTransaction(async (tx) => {
    const [attendanceSnap, ...snaps] = await tx.getAll(
      attendanceRef,
      ...bookingsRefs,
      ...bookingsRefs.map((ref) =>
        ref.collection(BookingSubCollection.BookedSlots).doc(slotId)
      )
    );
    const bookingsSnaps = snaps.slice(0, bookingsRefs.length);
    const bookingSnaps = snaps.slice(bookingsRefs.length);

    const ids = new Set(
      bookingsSnaps
        .filter((snap) => snap.exists)
        .map((snap) => (snap.data() as CustomerBookings).id)
    );
    if (ids.size !== 1) return null;
    const [id] = [...ids];

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

    const booking = bookingSnaps.find((snap) => snap.exists)?.data() as
      | CustomerBookingEntry
      | undefined;
    const before = (attendanceSnap.data() as SlotAttendnace | undefined)
      ?.attendances?.[id];
    const after = deriveAttendanceEntry(booking, before, { bookedPartOnly });

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
          new FieldPath("attendances", id),
          after || FieldValue.delete()
        );
      }
    }

    return { customerId: id, before, after, changed };
  });
};
// #endregion attendance
