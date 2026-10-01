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
  Customer,
  SlotAttendnace,
  SlotBookingsCounts,
} from "@eisbuk/shared";

import { Firestore } from "./types";

import {
  AttendedSlot,
  deriveAttendanceEntry,
  getAttendedSlotInterval,
  normalizeAttendanceEntry,
  selectBooking,
  syncAttendanceEntry,
  syncAttendedSlot,
  syncMonthBookingsCounts,
} from "../bookingSync";

/**
 * Reconciliation of the data derived from athletes' bookings (#987, #988):
 * - `slotBookingsCounts/{YYYY-MM}.{slotId}`: the number of bookings for the slot
 * - `attendance/{slotId}.attendances.{customerId}`: the booked part of an athlete's attendance
 * - `bookings/{secretKey}/attendedSlots/{slotId}`: lessons attended without a booking, for the athlete's calendar
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
 * - attended slots: made to match the attendance (after the attendance repair), created, updated or removed
 *
 * The attended slots are checked against the attendance as it will be after the attendance repair (the planned
 * entries), so an entry the repair changes (e.g. a cancelled booking's entry keeping the admin's attended interval)
 * gets its attended slot in the same run.
 */

/** Why a difference is reported but not repaired */
export type SkipReason =
  /** Past lesson: entry missing, or entry without a booking. Needs review by the club. */
  | "past-lesson"
  /** The athlete's bookings document (or, for attended slots, the customer) can't be found */
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
  /** Lesson date */
  date: string;
  booking?: CustomerBookingEntry;
  /** The entry as stored (possibly malformed) */
  before?: CustomerAttendance;
  /** The entry derived from the booking (what the triggers would write) */
  expected?: CustomerAttendance;
  /** What the repair writes (dry run) or wrote (apply) */
  after?: CustomerAttendance;
  skipped?: SkipReason;
}

export interface AttendedSlotDifference {
  slotId: string;
  customerId: string;
  /** The attended slot under the customer's current secret key */
  before?: AttendedSlot;
  /** What the repair writes (dry run) or wrote (apply) */
  after?: AttendedSlot;
  /** Attended slots under the customer's other bookings documents (removed by the repair) */
  stale?: number;
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
  attendedSlots: AttendedSlotDifference[];
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
  /** Check (and repair) the attended slots (default: true) */
  attendedSlots?: boolean;
}

interface Booking {
  secretKey: string;
  customerId: string;
  slotId: string;
  booking: CustomerBookingEntry;
  /** Update time of the booking document, in milliseconds */
  updateTime: number;
}

interface StoredAttendedSlot {
  secretKey: string;
  customerId: string;
  slotId: string;
  attendedSlot: AttendedSlot;
}

/**
 * Reads the bookings, attended slots, attendance and counts for the given months.
 *
 * Bookings and attended slots are read per athlete (one query each), which needs only the default single field
 * indexes.
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

  // An athlete can have more than one bookings document (secret key changed): a booking under any of them counts
  const secretKeys = new Map<string, string[]>();
  for (const doc of bookingsDocs) {
    const { id } = doc.data() as CustomerBookings;
    if (id) secretKeys.set(id, [...(secretKeys.get(id) || []), doc.id]);
  }

  const inMonths = (
    doc: (typeof bookingsDocs)[number],
    subCollection: BookingSubCollection
  ) =>
    doc.ref
      .collection(subCollection)
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .get()
      .then(({ docs }) => docs);

  const bookings = await Promise.all(
    bookingsDocs.map((doc) =>
      inMonths(doc, BookingSubCollection.BookedSlots).then((docs) =>
        docs.map(
          (bookedSlot): Booking => ({
            secretKey: doc.id,
            customerId: (doc.data() as CustomerBookings).id,
            slotId: bookedSlot.id,
            booking: bookedSlot.data() as CustomerBookingEntry,
            updateTime: bookedSlot.updateTime.toMillis(),
          })
        )
      )
    )
  ).then((perAthlete) => perAthlete.flat());

  const attendedSlots = await Promise.all(
    bookingsDocs.map((doc) =>
      inMonths(doc, BookingSubCollection.AttendedSlots).then((docs) =>
        docs.map(
          (attendedSlot): StoredAttendedSlot => ({
            secretKey: doc.id,
            customerId: (doc.data() as CustomerBookings).id,
            slotId: attendedSlot.id,
            attendedSlot: attendedSlot.data() as AttendedSlot,
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

  // Customers' current secret keys: their booking is preferred when there's more than one (see `selectBooking`),
  // and their attended slots are kept under it
  const currentSecretKeys = await orgRef
    .collection(OrgSubCollection.Customers)
    .get()
    .then(
      ({ docs }) =>
        new Map(docs.map((doc) => [doc.id, (doc.data() as Customer).secretKey]))
    );

  return {
    secretKeys,
    currentSecretKeys,
    bookings,
    attendedSlots,
    attendance,
    counts,
  };
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

/**
 * The booking that counts for each slot/athlete (keyed `slotId/customerId`): an athlete can hold more than one,
 * see `selectBooking`.
 */
export const selectBookings = <
  B extends Omit<Booking, "slotId"> & { slotId: string }
>(
  bookings: B[],
  currentSecretKeys: Map<string, string>
) =>
  new Map(
    Object.entries(
      _.groupBy(bookings, (b) => `${b.slotId}/${b.customerId}`)
    ).map(([key, candidates]) => [
      key,
      selectBooking(
        candidates,
        currentSecretKeys.get(candidates[0].customerId)
      )!,
    ])
  );

const findAttendanceDifferences = (
  bookings: Booking[],
  attendance: Map<string, SlotAttendnace>,
  secretKeys: Map<string, string[]>,
  currentSecretKeys: Map<string, string>,
  today: string
): AttendanceDifference[] => {
  const bookingsByEntry = selectBookings(bookings, currentSecretKeys);
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
    const booking = bookingsByEntry.get(key)?.booking;
    const before = attendance.get(slotId)?.attendances?.[customerId];
    const current = normalizeAttendanceEntry(before);
    const date = (attendance.get(slotId)?.date || booking?.date)!;

    const expected = deriveAttendanceEntry(booking, current);
    if (_.isEqual(before, expected)) continue;

    const difference: AttendanceDifference = {
      slotId,
      customerId,
      date,
      ..._.omitBy({ booking, before, expected }, _.isUndefined),
    };

    if (!secretKeys.has(customerId)) {
      differences.push({ ...difference, skipped: "unknown-athlete" });
      continue;
    }

    const after = deriveAttendanceEntry(booking, current, {
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
 * The attendance with the entries the attendance repair will write (`after` of the differences it repairs).
 */
const withPlannedRepair = (
  attendance: Map<string, SlotAttendnace>,
  differences: AttendanceDifference[]
) => {
  const planned = new Map(
    [...attendance].map(([slotId, doc]) => [
      slotId,
      { ...doc, attendances: { ...(doc.attendances || {}) } },
    ])
  );
  for (const { slotId, customerId, date, after, skipped } of differences) {
    if (skipped) continue;
    const doc = planned.get(slotId) || { date, attendances: {} };
    if (after) {
      doc.attendances[customerId] = after;
    } else {
      delete doc.attendances[customerId];
    }
    planned.set(slotId, doc);
  }
  return planned;
};

const findAttendedSlotDifferences = (
  attendedSlots: StoredAttendedSlot[],
  attendance: Map<string, SlotAttendnace>,
  currentSecretKeys: Map<string, string>
): AttendedSlotDifference[] => {
  const storedByEntry = _.groupBy(
    attendedSlots,
    ({ slotId, customerId }) => `${slotId}/${customerId}`
  );
  const entries = new Set([
    ...Object.keys(storedByEntry),
    ...[...attendance].flatMap(([slotId, { attendances }]) =>
      Object.entries(attendances || {})
        .filter(([, entry]) => getAttendedSlotInterval(entry))
        .map(([customerId]) => `${slotId}/${customerId}`)
    ),
  ]);

  const differences: AttendedSlotDifference[] = [];
  for (const key of [...entries].sort()) {
    const [slotId, customerId] = key.split("/");
    const doc = attendance.get(slotId);
    const interval = getAttendedSlotInterval(doc?.attendances?.[customerId]);
    const expected = interval ? { date: doc!.date, interval } : undefined;

    const secretKey = currentSecretKeys.get(customerId);
    const stored = storedByEntry[key] || [];
    const before = stored.find((s) => s.secretKey === secretKey)?.attendedSlot;
    const stale = stored.filter((s) => s.secretKey !== secretKey).length;

    if (_.isEqual(before, expected) && !stale) continue;

    differences.push({
      slotId,
      customerId,
      ..._.omitBy(
        { before, after: expected, stale: stale || undefined },
        _.isUndefined
      ),
      ...(secretKey ? {} : { skipped: "unknown-athlete" as const }),
    });
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
    attendedSlots: checkAttendedSlots = true,
  }: ReconcileOptions
): Promise<BookingDerivedDataReport> => {
  const {
    secretKeys,
    currentSecretKeys,
    bookings,
    attendedSlots,
    attendance,
    counts,
  } = await readMonths(db, organization, from, to);

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
      currentSecretKeys,
      today
    ),
    attendedSlots: [],
  };
  if (checkAttendedSlots) {
    report.attendedSlots = findAttendedSlotDifferences(
      attendedSlots,
      withPlannedRepair(attendance, report.attendance),
      currentSecretKeys
    );
  }

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

      const { slotId, customerId, date } = difference;
      const result = await syncAttendanceEntry(
        db,
        organization,
        slotId,
        secretKeys.get(customerId)!,
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

  // After the attendance repair: the attended slots are derived from the attendance
  report.attendedSlots = await Promise.all(
    report.attendedSlots.map(async (difference) => {
      if (difference.skipped) return difference;

      const { slotId, customerId } = difference;
      const result = await syncAttendedSlot(
        db,
        organization,
        slotId,
        customerId
      );

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

/**
 * A summary of a report safe to log: ids, intervals and totals, without booking notes (free text).
 */
export const summarizeReport = ({
  attendance,
  attendedSlots,
  ...report
}: BookingDerivedDataReport) => {
  const intervals = (entry?: CustomerAttendance) =>
    entry && {
      bookedInterval: entry.bookedInterval ?? null,
      attendedInterval: entry.attendedInterval ?? null,
    };
  const skipped = <T extends { skipped?: SkipReason }>(differences: T[]) =>
    _.countBy(
      differences.filter((d) => d.skipped),
      ({ skipped }) => skipped
    );
  return {
    ...report,
    attendance: attendance
      .filter((d) => !d.skipped)
      .map(({ slotId, customerId, date, before, after }) => ({
        slotId,
        customerId,
        date,
        before: intervals(before) || null,
        after: intervals(after) || null,
      })),
    skipped: skipped(attendance),
    attendedSlots: attendedSlots
      .filter((d) => !d.skipped)
      .map(({ slotId, customerId, before, after, stale }) => ({
        slotId,
        customerId,
        before: before?.interval ?? null,
        after: after?.interval ?? null,
        stale: stale ?? 0,
      })),
    skippedAttendedSlots: skipped(attendedSlots),
  };
};
