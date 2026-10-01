/**
 * @vitest-environment node
 */

import { v4 as uuid } from "uuid";
import { describe, expect } from "vitest";
import { FieldValue } from "@google-cloud/firestore";

import {
  Category,
  Collection,
  CustomerAttendance,
  CustomerBookingEntry,
  CustomerFull,
  OrgSubCollection,
  SlotInterface,
  SlotType,
  sanitizeCustomer,
} from "@eisbuk/shared";

import { adminDb } from "@/__testSetup__/firestoreSetup";
import { setUpOrganization } from "@/__testSetup__/node";

import {
  getAttendanceDocPath,
  getBookedSlotDocPath,
  getBookingsDocPath,
  getSlotDocPath,
} from "@/utils/firestore";

import { waitFor } from "@/__testUtils__/helpers";
import { testWithEmulator } from "@/__testUtils__/envUtils";

// The functions behind the `dbBookingDerivedDataReconcile` and `dbBookedSlotsAttendanceAutofix` callables, called
// directly: in this test environment, the callables don't receive the signed in user (the bundled functions
// don't get the emulator's callable auth), so admin-only callables can't be called.
import { reconcileBookingDerivedData } from "../../../functions/src/checks/bookingDerivedData";
import { bookedSlotsAttendanceAutofix } from "../../../functions/src/checks/bookingsAttendance";

/**
 * Tests for the reconciliation of the data derived from bookings (#987, #988): `reconcileBookingDerivedData`
 * (`dbBookingDerivedDataReconcile`) and `bookedSlotsAttendanceAutofix` (`dbBookedSlotsAttendanceAutofix`).
 *
 * The athletes here have a bookings document but no customer document. The data triggers keep their derived data
 * in sync on booking writes, but can't find their bookings on attendance writes (`syncAttendanceWithBookings` looks
 * them up from the customer), so the inconsistencies set up below stay until reconciled, as historical ones do.
 */

// #region fixtures
const intervals = {
  short: "16:00-17:00",
  long: "16:00-18:00",
  late: "17:00-18:00",
};

const future = { id: "future-slot", date: "2030-02-11", month: "2030-02" };
const past = { id: "past-slot", date: "2020-01-13", month: "2020-01" };

const createSlot = ({ id, date }: typeof future): SlotInterface => ({
  id,
  date,
  type: SlotType.Ice,
  categories: [Category.Competitive],
  intervals: Object.fromEntries(
    Object.values(intervals).map((interval) => {
      const [startTime, endTime] = interval.split("-");
      return [interval, { startTime, endTime }];
    })
  ),
  notes: "",
});

const createAthlete = (name: string): CustomerFull => ({
  id: `${name}-${uuid().slice(0, 8)}`,
  secretKey: uuid(),
  name: "Athlete",
  surname: name,
  categories: [Category.Competitive],
  certificateExpiration: "2031-01-01",
  birthday: "2000-01-01",
  subscriptionNumber: "",
});

const entry = (
  bookedInterval: string | null,
  attendedInterval: string | null
): CustomerAttendance => ({ bookedInterval, attendedInterval });
// #endregion fixtures

interface Report {
  applied: boolean;
  counts: {
    month: string;
    slotId: string;
    before?: number;
    after: number;
  }[];
  attendance: {
    slotId: string;
    customerId: string;
    secretKey?: string;
    date: string;
    booking?: CustomerBookingEntry;
    before?: CustomerAttendance;
    expected?: CustomerAttendance;
    after?: CustomerAttendance;
    skipped?: string;
  }[];
}

const reconcile = (organization: string, apply = false) =>
  reconcileBookingDerivedData(adminDb, organization, {
    from: past.month,
    to: future.month,
    apply,
  }) as Promise<Report>;

const settle = () => new Promise((resolve) => setTimeout(resolve, 3000));

const byEntry = (a: { slotId: string; customerId: string }) =>
  `${a.slotId}/${a.customerId}`;
const sortByEntry = <T extends { slotId: string; customerId: string }>(
  entries: T[]
) => [...entries].sort((a, b) => byEntry(a).localeCompare(byEntry(b)));

/**
 * Sets up an organization with a future and a past slot, and bookings whose derived data is then made inconsistent
 * in every way the reconciliation distinguishes.
 */
const setUpInconsistentData = async () => {
  const { organization } = await setUpOrganization({ doLogin: false });
  const orgRef = adminDb.collection(Collection.Organizations).doc(organization);
  const countsRef = (month: string) =>
    orgRef.collection(OrgSubCollection.SlotBookingsCounts).doc(month);
  const attendanceRef = (slotId: string) =>
    adminDb.doc(getAttendanceDocPath(organization, slotId));
  const getAttendance = async (slotId: string) =>
    (await attendanceRef(slotId).get()).data()!.attendances as Record<
      string,
      CustomerAttendance
    >;

  const athletes = {
    kv5Shape: createAthlete("kv5Shape"),
    adminEdited: createAthlete("adminEdited"),
    consistent: createAthlete("consistent"),
    missing: createAthlete("missing"),
    stray: createAthlete("stray"),
    pastMismatch: createAthlete("pastMismatch"),
    pastMissing: createAthlete("pastMissing"),
    pastStray: createAthlete("pastStray"),
    newcomer: createAthlete("newcomer"),
  };
  const ghost = "unknown-athlete-id";

  await Promise.all([
    ...[future, past].map((slot) =>
      adminDb.doc(getSlotDocPath(organization, slot.id)).set(createSlot(slot))
    ),
    ...Object.values(athletes).map((athlete) =>
      adminDb
        .doc(getBookingsDocPath(organization, athlete.secretKey))
        .set(sanitizeCustomer(athlete))
    ),
  ]);
  await waitFor(async () => {
    const docs = await Promise.all(
      [future, past].map(({ id }) => attendanceRef(id).get())
    );
    expect(docs.every((doc) => doc.exists)).toEqual(true);
  }, 20000);

  const book = (athlete: CustomerFull, slot: typeof future) =>
    adminDb
      .doc(getBookedSlotDocPath(organization, athlete.secretKey, slot.id))
      .set({ date: slot.date, interval: intervals.long });

  await Promise.all([
    ...[
      athletes.kv5Shape,
      athletes.adminEdited,
      athletes.consistent,
      athletes.missing,
    ].map((athlete) => book(athlete, future)),
    ...[athletes.pastMismatch, athletes.pastMissing].map((athlete) =>
      book(athlete, past)
    ),
  ]);
  await waitFor(async () => {
    expect((await countsRef(future.month).get()).data()?.[future.id]).toEqual(
      4
    );
    expect((await countsRef(past.month).get()).data()?.[past.id]).toEqual(2);
    expect(Object.keys(await getAttendance(future.id))).toHaveLength(4);
    expect(Object.keys(await getAttendance(past.id))).toHaveLength(2);
  }, 15000);

  // Let the data triggers finish: a recount or sync still running (e.g. retrying after contention) would
  // otherwise repair the inconsistencies set up below before the reconciliation sees them
  await settle();

  // Make the derived data inconsistent
  await countsRef(future.month).set(
    { [future.id]: 3, "deleted-slot": -2 },
    { merge: true }
  );
  await attendanceRef(future.id).update({
    // The shape seen in production on #988
    [`attendances.${athletes.kv5Shape.id}`]: entry(
      intervals.short,
      intervals.short
    ),
    // Admin recorded a late arrival
    [`attendances.${athletes.adminEdited.id}`]: entry(
      intervals.short,
      intervals.late
    ),
    [`attendances.${athletes.missing.id}`]: FieldValue.delete(),
    [`attendances.${athletes.stray.id}`]: entry(intervals.long, intervals.long),
    [`attendances.${ghost}`]: entry(intervals.long, intervals.long),
  });
  await attendanceRef(past.id).update({
    [`attendances.${athletes.pastMismatch.id}`]: entry(
      intervals.short,
      intervals.short
    ),
    [`attendances.${athletes.pastMissing.id}`]: FieldValue.delete(),
    [`attendances.${athletes.pastStray.id}`]: entry(
      intervals.long,
      intervals.long
    ),
  });

  await settle();
  // The inconsistencies are still there
  expect((await countsRef(future.month).get()).data()?.[future.id]).toEqual(3);
  expect((await getAttendance(future.id))[athletes.kv5Shape.id]).toEqual(
    entry(intervals.short, intervals.short)
  );

  return {
    organization,
    athletes,
    ghost,
    countsRef,
    getAttendance,
    book,
  };
};

describe("Reconciliation of data derived from bookings", () => {
  testWithEmulator(
    "dry run: reports every difference and the value the repair would write, and writes nothing",
    async () => {
      const { organization, athletes, ghost, countsRef, getAttendance } =
        await setUpInconsistentData();
      const before = {
        counts: (await countsRef(future.month).get()).data(),
        future: await getAttendance(future.id),
        past: await getAttendance(past.id),
      };

      const report = await reconcile(organization);

      expect(report.applied).toEqual(false);
      expect(report.counts).toEqual([
        {
          month: future.month,
          slotId: "deleted-slot",
          before: -2,
          after: 0,
        },
        { month: future.month, slotId: future.id, before: 3, after: 4 },
      ]);

      const booking = (date: string) => ({ date, interval: intervals.long });
      const booked = entry(intervals.long, intervals.long);
      expect(
        sortByEntry(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          report.attendance.map(({ secretKey, ...difference }) => difference)
        )
      ).toEqual(
        sortByEntry([
          {
            slotId: future.id,
            customerId: athletes.kv5Shape.id,
            date: future.date,
            booking: booking(future.date),
            before: entry(intervals.short, intervals.short),
            expected: booked,
            after: booked,
          },
          {
            slotId: future.id,
            customerId: athletes.adminEdited.id,
            date: future.date,
            booking: booking(future.date),
            before: entry(intervals.short, intervals.late),
            expected: entry(intervals.long, intervals.late),
            after: entry(intervals.long, intervals.late),
          },
          {
            slotId: future.id,
            customerId: athletes.missing.id,
            date: future.date,
            booking: booking(future.date),
            expected: booked,
            after: booked,
          },
          {
            slotId: future.id,
            customerId: athletes.stray.id,
            date: future.date,
            before: booked,
          },
          {
            slotId: future.id,
            customerId: ghost,
            date: future.date,
            before: booked,
            skipped: "unknown-athlete",
          },
          {
            // Past lesson: only the booked interval is repaired, the attended interval stays
            slotId: past.id,
            customerId: athletes.pastMismatch.id,
            date: past.date,
            booking: booking(past.date),
            before: entry(intervals.short, intervals.short),
            expected: booked,
            after: entry(intervals.long, intervals.short),
          },
          {
            slotId: past.id,
            customerId: athletes.pastMissing.id,
            date: past.date,
            booking: booking(past.date),
            expected: booked,
            skipped: "past-lesson",
          },
          {
            slotId: past.id,
            customerId: athletes.pastStray.id,
            date: past.date,
            before: booked,
            skipped: "past-lesson",
          },
        ])
      );

      // Nothing written
      expect((await countsRef(future.month).get()).data()).toEqual(
        before.counts
      );
      expect(await getAttendance(future.id)).toEqual(before.future);
      expect(await getAttendance(past.id)).toEqual(before.past);
    },
    { timeout: 60000 }
  );

  testWithEmulator(
    "apply: repairs counts and booked intervals, keeps the admin's attendance, and doesn't lose a booking made meanwhile",
    async () => {
      const { organization, athletes, ghost, countsRef, getAttendance, book } =
        await setUpInconsistentData();

      // A booking is made while the repair runs
      const [report] = await Promise.all([
        reconcile(organization, true),
        book(athletes.newcomer, future),
      ]);
      expect(report.applied).toEqual(true);

      const booked = entry(intervals.long, intervals.long);
      await waitFor(async () => {
        const counts = (await countsRef(future.month).get()).data()!;
        expect(counts[future.id]).toEqual(5);
        expect(counts["deleted-slot"]).toEqual(0);

        const attendance = await getAttendance(future.id);
        expect(attendance).toEqual({
          [athletes.kv5Shape.id]: booked,
          [athletes.adminEdited.id]: entry(intervals.long, intervals.late),
          [athletes.consistent.id]: booked,
          [athletes.missing.id]: booked,
          [athletes.newcomer.id]: booked,
          // Unknown athlete: left as it was
          [ghost]: booked,
        });
      });
      expect(await getAttendance(past.id)).toEqual({
        [athletes.pastMismatch.id]: entry(intervals.long, intervals.short),
        // Past lesson, no booking: left for the club to review
        [athletes.pastStray.id]: booked,
      });

      // Converged: only the differences the repair leaves for review remain
      const again = await reconcile(organization);
      expect(again.counts).toEqual([]);
      expect(
        sortByEntry(again.attendance).map(({ customerId, skipped }) => ({
          customerId,
          skipped,
        }))
      ).toEqual(
        sortByEntry([
          { slotId: future.id, customerId: ghost, skipped: "unknown-athlete" },
          {
            slotId: past.id,
            customerId: athletes.pastMissing.id,
            skipped: "past-lesson",
          },
          {
            slotId: past.id,
            customerId: athletes.pastStray.id,
            skipped: "past-lesson",
          },
        ]).map(({ customerId, skipped }) => ({ customerId, skipped }))
      );
    },
    { timeout: 60000 }
  );

  testWithEmulator(
    "dbBookedSlotsAttendanceAutofix: repairs booked intervals without overwriting the admin's attended interval",
    async () => {
      const { organization, athletes, ghost, getAttendance } =
        await setUpInconsistentData();

      await bookedSlotsAttendanceAutofix(adminDb, organization);

      const booked = entry(intervals.long, intervals.long);
      expect(await getAttendance(future.id)).toEqual({
        [athletes.kv5Shape.id]: booked,
        [athletes.adminEdited.id]: entry(intervals.long, intervals.late),
        [athletes.consistent.id]: booked,
        [athletes.missing.id]: booked,
        [ghost]: booked,
      });
    },
    { timeout: 60000 }
  );
});
