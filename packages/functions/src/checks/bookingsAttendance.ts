import { DateTime } from "luxon";
import {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  FieldValue,
} from "@google-cloud/firestore";

import {
  BookingSubCollection,
  Collection,
  CustomerBookingEntry,
  OrgSubCollection,
  SlotAttendnace,
  wrapIter,
  BookedSlotsAttendanceSanityCheckReport,
  valueMapper,
  CustomerBookings,
  _reduce,
  keyMapper,
  ID,
  CustomerAttendance,
  BookedSlotsAttendanceAutofixReport,
} from "@eisbuk/shared";

import { Firestore } from "./types";
import _ from "lodash";

type MismatchReport = {
  booking: CustomerBookingEntry;
  attendance: CustomerAttendance;
};

type MetaReport = Partial<MismatchReport> & {
  slotId: string;
  customerId: string;
};

/**
 * A util used by slot related check cloud function used to find mismatch between slot and attendance entries.
 */
export const findBookedSlotsAttendanceMismatches = async (
  db: Firestore,
  organization: string
): Promise<BookedSlotsAttendanceSanityCheckReport> => {
  const timestamp = DateTime.now().toISO();

  // We're only checking for slots/attendances in the last 3 months
  // This will actually be between 3 and 4 months to start from the beginning of the T-3 month and include the partial final month (up until today)
  const startDate = DateTime.now()
    .minus({ months: 3 })
    .startOf("month")
    .toISODate();

  const orgRef = db.collection(Collection.Organizations).doc(organization);

  const attendanceRef = orgRef.collection(
    OrgSubCollection.Attendance
  ) as CollectionReference<SlotAttendnace>;
  const attendancesPromise = dateConstrained(attendanceRef, startDate)
    .get()
    .then(({ docs }) => docs.map((doc) => [doc.id, doc.data()!] as const));

  const bookingsRef = orgRef.collection(
    OrgSubCollection.Bookings
  ) as CollectionReference<CustomerBookings>;
  const bookedSlotsPromise = bookingsRef
    .get()
    .then(({ docs }) => docs.map(getBookedSlotsForCustomer(startDate)))
    .then((x) => Promise.all(x));

  const [attendance, bookedSlots] = await Promise.all([
    attendancesPromise,
    bookedSlotsPromise,
  ]);

  const normaliseBookedSlots = ({
    bookedSlots,
    id: customerId,
  }: Omit<CustomerBookings, "bookedSlots"> & {
    bookedSlots: [string, CustomerBookingEntry][];
  }): MetaReport[] =>
    bookedSlots.map(([slotId, booking]) => ({
      slotId,
      customerId,
      booking,
    }));

  const normaliseAttendances = ([slotId, doc]: readonly [
    string,
    SlotAttendnace
  ]): MetaReport[] =>
    Object.entries(doc.attendances).map(([customerId, attendance]) => ({
      slotId,
      customerId,
      attendance,
    }));

  const normalisedBookedSlots =
    wrapIter(bookedSlots).flatMap(normaliseBookedSlots);
  const normalisedAttendance =
    wrapIter(attendance).flatMap(normaliseAttendances);

  const allEntries = wrapIter([
    ...normalisedBookedSlots,
    ...normalisedAttendance,
  ])
    // Group reports by '<slotId>--<customerId>' tag, resulting in Iterable of { tag => Report } tuples
    // There will be at most two enties with the same tag (one for booking and one for attendance)
    //
    // Result: Iterable of { tag => [Report, Report] } pairs
    ._group(({ slotId: s, customerId: c, ...report }) => [`${s}--${c}`, report])
    // Merge the booking and attendance reports for each slot/customer tag into a single report
    // (if one of the two is missing, it will simply be undefined in the merged report)
    //
    // Result: Iterable of { tag => Report } pairs
    .map(valueMapper((r) => _reduce(r, (acc, x) => ({ ...acc, ...x }), {})))
    // Filter out reports where the intervals in booked slots and attendance for customer match
    .filter(([, report]) => !isReportMatched(report))
    // Split the keys (tags) into [slotId, customerId] tuples
    //
    // Result: Iterable of { [slotId, customerId] => Report } pairs
    .map(keyMapper((tag) => tag.split("--") as [string, string]))
    // Result: Iterable of [slotId, customerId, Report] tuples
    .map(([k, v]) => [...k, v] as [string, string, MismatchReport])
    // Materialise the array as these will be iterated over multiple times (for each of the: mismatched, missing and stray checks)
    ._array();

  const strayAttendances = Object.fromEntries(
    wrapIter(allEntries)
      // Here we're interested only in entries where there's no booking present
      .filter(([, , { booking }]) => !booking)
      .map(([id, ...r]) => [id, r] as [string, [string, MismatchReport]])
      ._group(ID)
      .map(valueMapper((bookings) => Object.fromEntries(bookings)))
  );

  const mismatchedAttendances = Object.fromEntries(
    wrapIter(allEntries)
      // Here we're interested in entries where there are both booking and attendance present
      // The matching booking and attendance will have been filtered out in the previous step
      .filter(([, , { booking, attendance }]) => Boolean(booking && attendance))
      .map(([id, ...r]) => [id, r] as [string, [string, MismatchReport]])
      ._group(ID)
      .map(valueMapper((bookings) => Object.fromEntries(bookings)))
  );

  const missingAttendances = Object.fromEntries(
    wrapIter(allEntries)
      // Here we're interested only in entries where there's no attendance present
      .filter(([, , { attendance }]) => !attendance)
      .map(([id, ...r]) => [id, r] as [string, [string, MismatchReport]])
      ._group(ID)
      .map(valueMapper((bookings) => Object.fromEntries(bookings)))
  );

  return {
    id: timestamp,
    strayAttendances,
    mismatchedAttendances,
    missingAttendances,
  };
};

export const bookedSlotsAttendanceAutofix = async (
  db: Firestore,
  organization: string,
  mismatches: BookedSlotsAttendanceSanityCheckReport
): Promise<BookedSlotsAttendanceAutofixReport> => {
  const report = {
    timestamp: DateTime.now().toISO(),
    created: {},
    deleted: {},
    updated: {},
  };

  const batch = db.batch();

  const { mismatchedAttendances, missingAttendances, strayAttendances } =
    mismatches;

  const orgRef = db.collection(Collection.Organizations).doc(organization);
  const attendance = orgRef.collection(OrgSubCollection.Attendance);

  /** Document we're queueing updates for the given slot's attendance into */
  type AttendanceUpdate = {
    attendances: {
      [customerId: string]: CustomerAttendance | FieldValue;
    };
  };
  /** Aggregated updates per each slot attendance document */
  const updates = new Map<string, AttendanceUpdate>();
  const queueUpdate = (
    slotId: string,
    customerId: string,
    after: CustomerAttendance | FieldValue
  ) => {
    const slot = updates.get(slotId) || { attendances: {} };
    slot.attendances[customerId] = after;
    updates.set(slotId, slot);
  };

  // Delete strays
  //
  // Result: Iterable of { slotId => { [customerId: string]: { attendance } }}
  const toDelete = wrapIter(Object.entries(strayAttendances))
    // Result: Iterable of { slotId => { customerId => { attendance } } } pairs
    .map(valueMapper((customers) => Object.entries(customers)))
    // Result: Iterable of [slotId, customerId, { attendance }] tuples
    .flatMap(([slotId, c]) => c.map((kv) => [slotId, ...kv] as const));

  for (const [slotId, customerId, r] of toDelete) {
    const before = r.attendance;

    queueUpdate(slotId, customerId, FieldValue.delete());
    // Using _.set as a convenience method to create all of the parent nodes for the property (if they don't exist)
    _.set(report, ["deleted", slotId, customerId], { before });
  }

  // Create missing
  //
  // Result: Iterable of { slotId => { [customerId: string]: { booking } }}
  const toCreate = wrapIter(Object.entries(missingAttendances))
    // Result: Iterable of { slotId => { customerId => { booking } } } pairs
    .map(valueMapper((customers) => Object.entries(customers)))
    // Result: Iterable of [slotId, customerId, { booking }] tuples
    .flatMap(([slotId, c]) => c.map((kv) => [slotId, ...kv] as const));

  for (const [slotId, customerId, r] of toCreate) {
    const bookedInterval = r.booking?.interval;
    const attendedInterval = r.booking?.interval;

    const after = { bookedInterval, attendedInterval };

    queueUpdate(slotId, customerId, after);
    // Using _.set as a convenience method to create all of the parent nodes for the property (if they don't exist)
    _.set(report, ["created", slotId, customerId], { after });
  }

  // Update mismatched
  //
  // Result: Iterable of { slotId => { [customerId: string]: { attendance, booking } }}
  const toUpdate = wrapIter(Object.entries(mismatchedAttendances))
    // Result: Iterable of { slotId => { customerId => { attendance, booking } } } pairs
    .map(valueMapper((customers) => Object.entries(customers)))
    // Result: Iterable of [slotId, customerId, { attendance, booking }] tuples
    .flatMap(([slotId, c]) => c.map((kv) => [slotId, ...kv] as const));

  for (const [slotId, customerId, r] of toUpdate) {
    const bookedInterval = r.booking?.interval;
    const attendedInterval = r.booking?.interval;

    const before = r.attendance;
    const after = { bookedInterval, attendedInterval };

    queueUpdate(slotId, customerId, after);
    // Using _.set as a convenience method to create all of the parent nodes for the property (if they don't exist)
    _.set(report, ["updated", slotId, customerId], { before, after });
  }

  // Apply (batch) updates
  for (const [slotId, update] of updates) {
    batch.set(attendance.doc(slotId), update, { merge: true });
  }
  await batch.commit();

  return report;
};

// #region helpers
type DateConstraint = [startDate: string, endDate?: string];
const dateConstrained = <Data = DocumentData>(
  collection: CollectionReference<Data>,
  ...dateConstraint: DateConstraint
) => {
  const [startDate, endDate] = dateConstraint;
  const base = collection.where("date", ">=", startDate).orderBy("date", "asc");
  return endDate ? base.where("date", "<=", endDate) : base;
};

const getBookedSlotsForCustomer =
  (...dateConstraint: DateConstraint) =>
  async (doc: DocumentSnapshot<CustomerBookings>) => {
    const customer = doc.data()!;
    const bookedSlotsRef = doc.ref.collection(BookingSubCollection.BookedSlots);
    const bookedSlots = await dateConstrained(bookedSlotsRef, ...dateConstraint)
      .get()
      .then((snap) => snap.docs)
      .then<[string, CustomerBookingEntry][]>((docs) =>
        docs.map((doc) => [doc.id, doc.data() as CustomerBookingEntry])
      );
    return { ...customer, bookedSlots };
  };

const isReportMatched = ({
  attendance,
  booking,
}: Pick<MetaReport, "booking" | "attendance">) =>
  attendance?.bookedInterval === booking?.interval;
// #endregion helpers
