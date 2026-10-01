import { FieldPath } from "@google-cloud/firestore";
import { DateTime } from "luxon";
import _ from "lodash";

import {
  BookingSubCollection,
  CustomerAttendance,
  CustomerBookingEntry,
  CustomerBookings,
  Collection,
  OrgSubCollection,
  SlotAttendnace,
  SlotBookingsCounts,
} from "@eisbuk/shared";

import { Firestore } from "./types";

import {
  deriveAttendanceEntry,
  syncAttendanceEntry,
  syncMonthBookingsCounts,
} from "../bookingSync";

/**
 * Reconciliation of the data derived from athletes' bookings (#987, #988):
 * - `slotBookingsCounts/{YYYY-MM}.{slotId}`: the number of bookings for the slot
 * - `attendance/{slotId}.attendances.{customerId}`: the booked part of an athlete's attendance
 *
 * The check reads everything fresh (no stored reports) and lists the differences, together with the value the
 * repair would write. The repair doesn't write the values from the check: it re-runs the same transactional sync
 * the data triggers use, for each difference found, so a booking created, changed or cancelled meanwhile is
 * neither lost nor counted twice (its own trigger re-runs the same computation).
 *
 * What the repair changes:
 * - counts: recounted for every month with a difference
 * - attendance, lessons from `today` on: the entry is derived from the booking (see `deriveAttendanceEntry`);
 *   an `attendedInterval` set by the admin (different from the booked interval) is kept
 * - attendance, past lessons: only `bookedInterval` of existing entries. Other differences of past lessons
 *   (missing entries, entries without a booking, booking notes) are reported, not changed: the attendance may be
 *   the club's record of the lesson, and only the club can tell.
 */

/** Why a difference is reported but not repaired */
export type SkipReason =
  /** Past lesson: entry missing, or entry without a booking. Needs review by the club. */
  | "past-lesson"
  /** The athlete's bookings document can't be found: we can't tell whether they booked */
  | "unknown-athlete"
  /** At repair time, the slot or the athlete's bookings document was gone: nothing written */
  | "not-found";

export interface CountDifference {
  month: string;
  slotId: string;
  before: number | undefined;
  after: number;
}

export interface AttendanceDifference {
  slotId: string;
  customerId: string;
  /** The athlete's bookings document holding the booking (any of theirs, if not booked) */
  secretKey?: string;
  /** Lesson date */
  date: string;
  booking?: CustomerBookingEntry;
  before?: CustomerAttendance;
  /** The entry derived from the booking (what the triggers would write) */
  expected?: CustomerAttendance;
  /** What the repair writes (dry run) or wrote (apply) */
  after?: CustomerAttendance;
  skipped?: SkipReason;
}

export interface BookingDerivedDataReport {
  id: string;
  organization: string;
  /** First month checked, "YYYY-MM" */
  from: string;
  /** Last month checked, "YYYY-MM" */
  to: string;
  /** Lessons before this date are treated as past lessons */
  today: string;
  applied: boolean;
  counts: CountDifference[];
  attendance: AttendanceDifference[];
}

export interface ReconcileOptions {
  from: string;
  to: string;
  /** ISO date, defaults to the current date */
  today?: string;
  /** Write the repair (default: dry run) */
  apply?: boolean;
  /** Check (and repair) the counts (default: true) */
  counts?: boolean;
}

interface Booking {
  secretKey: string;
  customerId: string;
  slotId: string;
  booking: CustomerBookingEntry;
}

/**
 * Reads the bookings, attendance and counts for the given months.
 *
 * Bookings are read per athlete (one query each), which needs only the default single field indexes.
 */
const readMonths = async (
  db: Firestore,
  organization: string,
  from: string,
  to: string
) => {
  const startDate = `${from}-01`;
  const endDate = `${to}-31`;
  const orgRef = db.collection(Collection.Organizations).doc(organization);

  const bookingsDocs = await orgRef
    .collection(OrgSubCollection.Bookings)
    .get()
    .then(({ docs }) => docs);

  // An athlete can have more than one bookings document (secret key changed): bookings are always looked up
  // under the document holding them, this is only used for athletes without a booking for the slot
  const secretKeys = new Map<string, string>();
  for (const doc of bookingsDocs) {
    const { id } = doc.data() as CustomerBookings;
    if (id) secretKeys.set(id, doc.id);
  }

  const bookings = await Promise.all(
    bookingsDocs.map((doc) =>
      doc.ref
        .collection(BookingSubCollection.BookedSlots)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .get()
        .then(({ docs }) =>
          docs.map(
            (bookedSlot): Booking => ({
              secretKey: doc.id,
              customerId: (doc.data() as CustomerBookings).id,
              slotId: bookedSlot.id,
              booking: bookedSlot.data() as CustomerBookingEntry,
            })
          )
        )
    )
  ).then((perAthlete) => perAthlete.flat());

  const attendance = await orgRef
    .collection(OrgSubCollection.Attendance)
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get()
    .then(
      ({ docs }) =>
        new Map(docs.map((doc) => [doc.id, doc.data() as SlotAttendnace]))
    );

  const counts = await orgRef
    .collection(OrgSubCollection.SlotBookingsCounts)
    .where(FieldPath.documentId(), ">=", from)
    .where(FieldPath.documentId(), "<=", to)
    .get()
    .then(
      ({ docs }) =>
        new Map(docs.map((doc) => [doc.id, doc.data() as SlotBookingsCounts]))
    );

  return { secretKeys, bookings, attendance, counts };
};

const findCountDifferences = (
  bookings: Booking[],
  counts: Map<string, SlotBookingsCounts>
): CountDifference[] => {
  const actual = new Map<string, SlotBookingsCounts>();
  for (const { slotId, booking } of bookings) {
    const month = booking.date.substring(0, 7);
    const monthCounts = actual.get(month) || {};
    monthCounts[slotId] = (monthCounts[slotId] || 0) + 1;
    actual.set(month, monthCounts);
  }

  const months = new Set([...actual.keys(), ...counts.keys()]);
  return [...months].sort().flatMap((month) => {
    const stored = counts.get(month) || {};
    const monthActual = actual.get(month) || {};
    return [...new Set([...Object.keys(stored), ...Object.keys(monthActual)])]
      .sort()
      .map((slotId) => ({
        month,
        slotId,
        before: stored[slotId],
        after: monthActual[slotId] || 0,
      }))
      .filter(({ before, after }) => before !== after);
  });
};

const findAttendanceDifferences = (
  bookings: Booking[],
  attendance: Map<string, SlotAttendnace>,
  secretKeys: Map<string, string>,
  today: string
): AttendanceDifference[] => {
  const bookingsByEntry = new Map(
    bookings.map((b) => [`${b.slotId}/${b.customerId}`, b])
  );
  const entries = new Set([
    ...bookingsByEntry.keys(),
    ...[...attendance].flatMap(([slotId, { attendances }]) =>
      Object.keys(attendances || {}).map(
        (customerId) => `${slotId}/${customerId}`
      )
    ),
  ]);

  const differences: AttendanceDifference[] = [];
  for (const key of [...entries].sort()) {
    const [slotId, customerId] = key.split("/");
    const { booking, secretKey = secretKeys.get(customerId) } =
      bookingsByEntry.get(key) || {};
    const before = attendance.get(slotId)?.attendances?.[customerId];
    const date = (attendance.get(slotId)?.date || booking?.date)!;

    const expected = deriveAttendanceEntry(booking, before);
    if (_.isEqual(before, expected)) continue;

    const difference: AttendanceDifference = {
      slotId,
      customerId,
      date,
      ..._.omitBy({ secretKey, booking, before, expected }, _.isUndefined),
    };

    if (!secretKey) {
      differences.push({ ...difference, skipped: "unknown-athlete" });
      continue;
    }

    const after = deriveAttendanceEntry(booking, before, {
      bookedPartOnly: date < today,
    });
    differences.push(
      _.isEqual(before, after)
        ? { ...difference, skipped: "past-lesson" }
        : { ...difference, ..._.omitBy({ after }, _.isUndefined) }
    );
  }

  return differences;
};

/**
 * Checks (and, with `apply`, repairs) the data derived from bookings for lessons in the months `from`-`to`.
 */
export const reconcileBookingDerivedData = async (
  db: Firestore,
  organization: string,
  {
    from,
    to,
    today = DateTime.now().toISODate(),
    apply = false,
    counts: checkCounts = true,
  }: ReconcileOptions
): Promise<BookingDerivedDataReport> => {
  const { secretKeys, bookings, attendance, counts } = await readMonths(
    db,
    organization,
    from,
    to
  );

  const report: BookingDerivedDataReport = {
    id: DateTime.now().toISO(),
    organization,
    from,
    to,
    today,
    applied: apply,
    counts: checkCounts ? findCountDifferences(bookings, counts) : [],
    attendance: findAttendanceDifferences(
      bookings,
      attendance,
      secretKeys,
      today
    ),
  };

  if (!apply) return report;

  // Repair: re-run the sync for each difference found, and report what was actually written
  const months = [...new Set(report.counts.map(({ month }) => month))];
  const countResults = await Promise.all(
    months.map((month) => syncMonthBookingsCounts(db, organization, month))
  );
  report.counts = months.flatMap((month, i) =>
    Object.entries(countResults[i]).map(([slotId, { before, after }]) => ({
      month,
      slotId,
      before,
      after: after!,
    }))
  );

  report.attendance = await Promise.all(
    report.attendance.map(async (difference) => {
      if (difference.skipped) return difference;

      const { slotId, date } = difference;
      const result = await syncAttendanceEntry(
        db,
        organization,
        slotId,
        difference.secretKey!,
        { bookedPartOnly: date < today }
      );

      // Report the values read and written by the repair, not the planned ones
      const rest = _.omit(difference, ["before", "after"]);
      return result
        ? {
            ...rest,
            ..._.omitBy(
              { before: result.before, after: result.after },
              _.isUndefined
            ),
          }
        : { ...rest, skipped: "not-found" as const };
    })
  );

  return report;
};
