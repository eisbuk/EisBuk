import { DateTime } from "luxon";
import {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
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

import { reconcileBookingDerivedData } from "./bookingDerivedData";

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

/**
 * Repairs the attendance entries that contradict the bookings, for lessons from the beginning of the T-3 month on
 * (the same period as the check).
 *
 * It used to write both intervals from a (possibly old) check report, overwriting the attended interval recorded
 * by the admin. It now re-derives each entry from the current booking with the sync the data triggers use, so the
 * admin's attended interval is kept and bookings changed in the meantime are respected (see `bookingDerivedData.ts`).
 */
export const bookedSlotsAttendanceAutofix = async (
  db: Firestore,
  organization: string
): Promise<BookedSlotsAttendanceAutofixReport> => {
  const report: BookedSlotsAttendanceAutofixReport = {
    timestamp: DateTime.now().toISO(),
    created: {},
    deleted: {},
    updated: {},
  };

  const from = DateTime.now()
    .minus({ months: 3 })
    .startOf("month")
    .toFormat("yyyy-MM");
  const { attendance } = await reconcileBookingDerivedData(db, organization, {
    from,
    to: "9999-12",
    apply: true,
    counts: false,
  });

  for (const { slotId, customerId, before, after, skipped } of attendance) {
    if (skipped || _.isEqual(before, after)) continue;
    // Using _.set as a convenience method to create all of the parent nodes for the property (if they don't exist)
    if (!before) {
      _.set(report, ["created", slotId, customerId], { after });
    } else if (!after) {
      _.set(report, ["deleted", slotId, customerId], { before });
    } else {
      _.set(report, ["updated", slotId, customerId], { before, after });
    }
  }

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
