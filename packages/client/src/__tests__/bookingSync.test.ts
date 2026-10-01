/**
 * @vitest-environment node
 */

import { v4 as uuid } from "uuid";
import { describe, expect } from "vitest";

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
  getAttendedSlotDocPath,
  getBookedSlotDocPath,
  getBookingsDocPath,
  getCustomerDocPath,
  getSlotDocPath,
} from "@/utils/firestore";

import { waitFor } from "@/__testUtils__/helpers";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { deliverFirestoreWriteEvent } from "@/__testUtils__/firestoreEvents";

/**
 * Regression tests for #987 (booking counts drifting from the number of bookings) and
 * #988 (attendance contradicting the booking it derives from).
 *
 * First generation Firestore triggers are delivered at least once, in no particular order, and
 * can run concurrently. The emulator delivers each write once and in order, so duplicate and
 * out-of-order delivery is simulated by delivering a recorded event again, after the data has moved on.
 */

// #region fixtures
const date = "2030-02-11";
const month = date.substring(0, 7);

const intervals = {
  short: "16:00-17:00",
  long: "16:00-18:00",
  late: "17:00-18:00",
};

const createSlot = (id: string): SlotInterface => ({
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

const createAthlete = (i: number): CustomerFull => ({
  id: `athlete-${i}-${uuid().slice(0, 8)}`,
  secretKey: uuid(),
  name: "Athlete",
  surname: String(i),
  categories: [Category.Competitive],
  certificateExpiration: "2031-01-01",
  birthday: "2000-01-01",
  subscriptionNumber: "",
});
// #endregion fixtures

// #region helpers
/**
 * Sets up an organization with the given slots and athletes and waits for the derived documents
 * (slot attendance, athletes' bookings documents) to be created by the data triggers.
 */
const setUp = async (slotIds: string[], athleteCount: number) => {
  const { organization } = await setUpOrganization({ doLogin: false });
  const athletes = Array.from({ length: athleteCount }, (_, i) =>
    createAthlete(i)
  );

  await Promise.all([
    ...slotIds.map((id) =>
      adminDb.doc(getSlotDocPath(organization, id)).set(createSlot(id))
    ),
    ...athletes.map((athlete) =>
      adminDb.doc(getCustomerDocPath(organization, athlete.id)).set(athlete)
    ),
  ]);

  await waitFor(async () => {
    const docs = await Promise.all([
      ...slotIds.map((id) =>
        adminDb.doc(getAttendanceDocPath(organization, id)).get()
      ),
      ...athletes.map(({ secretKey }) =>
        adminDb.doc(getBookingsDocPath(organization, secretKey)).get()
      ),
    ]);
    expect(docs.every((doc) => doc.exists)).toEqual(true);
    // Allow for the emulator starting up the functions on the first run
  }, 20000);

  return { organization, athletes };
};

const bookingPath = (
  organization: string,
  athlete: CustomerFull,
  slotId: string
) => getBookedSlotDocPath(organization, athlete.secretKey, slotId);

const book = (
  organization: string,
  athlete: CustomerFull,
  slotId: string,
  interval: string
) =>
  adminDb
    .doc(bookingPath(organization, athlete, slotId))
    .set({ date, interval } as CustomerBookingEntry);

const cancel = (organization: string, athlete: CustomerFull, slotId: string) =>
  adminDb.doc(bookingPath(organization, athlete, slotId)).delete();

const getCount = async (organization: string, slotId: string) => {
  const snap = await adminDb
    .collection(Collection.Organizations)
    .doc(organization)
    .collection(OrgSubCollection.SlotBookingsCounts)
    .doc(month)
    .get();
  return snap.data()?.[slotId];
};

const getAttendance = async (
  organization: string,
  slotId: string,
  athlete: CustomerFull
): Promise<CustomerAttendance | undefined> => {
  const snap = await adminDb
    .doc(getAttendanceDocPath(organization, slotId))
    .get();
  return snap.data()?.attendances?.[athlete.id];
};

/** The athlete's attended slot (shown in their calendar for attendance without booking) */
const getAttendedSlot = async (
  organization: string,
  slotId: string,
  athlete: CustomerFull
) =>
  (
    await adminDb
      .doc(getAttendedSlotDocPath(organization, athlete.secretKey, slotId))
      .get()
  ).data();

/**
 * Writes the athlete's attendance entry as the admin attendance screen does
 * (`markAttendance` in `attendanceOperations.ts`): the whole entry, merged into the slot's attendance.
 */
const adminWriteAttendance = (
  organization: string,
  slotId: string,
  athlete: CustomerFull,
  entry: CustomerAttendance
) =>
  adminDb
    .doc(getAttendanceDocPath(organization, slotId))
    .set({ attendances: { [athlete.id]: entry } }, { merge: true });

const deliverBookingEvent = (
  functionName: "countSlotsBookings" | "createAttendanceForBooking",
  path: string,
  before: CustomerBookingEntry | null,
  after: CustomerBookingEntry | null
) => deliverFirestoreWriteEvent(functionName, path, before, after);
// #endregion helpers

describe("Booking derived data under at-least-once, unordered trigger delivery", () => {
  describe("countSlotsBookings", () => {
    testWithEmulator(
      "counts every booking when athletes book two slots of the same day concurrently",
      async () => {
        const slotIds = ["slot-a", "slot-b"];
        const { organization, athletes } = await setUp(slotIds, 12);

        // Each athlete books both lessons of the day at the same time (the pattern seen in production)
        await Promise.all(
          athletes.flatMap((athlete) =>
            slotIds.map((slotId) =>
              book(organization, athlete, slotId, intervals.short)
            )
          )
        );

        await waitFor(async () => {
          expect(await getCount(organization, "slot-a")).toEqual(12);
          expect(await getCount(organization, "slot-b")).toEqual(12);
        }, 20000);
      },
      { timeout: 40000 }
    );

    testWithEmulator(
      "counts correctly when bookings and cancellations happen concurrently",
      async () => {
        const slotId = "slot-a";
        const { organization, athletes } = await setUp([slotId], 12);
        const [staying, leaving, joining] = [
          athletes.slice(0, 4),
          athletes.slice(4, 8),
          athletes.slice(8),
        ];

        await Promise.all(
          [...staying, ...leaving].map((athlete) =>
            book(organization, athlete, slotId, intervals.short)
          )
        );
        await waitFor(async () =>
          expect(await getCount(organization, slotId)).toEqual(8)
        );

        await Promise.all([
          ...leaving.map((athlete) => cancel(organization, athlete, slotId)),
          ...joining.map((athlete) =>
            book(organization, athlete, slotId, intervals.long)
          ),
        ]);

        await waitFor(async () => {
          expect(await getCount(organization, slotId)).toEqual(8);
        }, 20000);
      },
      { timeout: 40000 }
    );

    testWithEmulator(
      "doesn't count a booking twice when its create event is processed twice",
      async () => {
        const slotId = "slot-a";
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);
        const booking = { date, interval: intervals.short };

        await book(organization, athlete, slotId, booking.interval);
        await waitFor(async () =>
          expect(await getCount(organization, slotId)).toEqual(1)
        );

        await deliverBookingEvent(
          "countSlotsBookings",
          bookingPath(organization, athlete, slotId),
          null,
          booking
        );

        expect(await getCount(organization, slotId)).toEqual(1);
      }
    );

    testWithEmulator(
      "doesn't subtract a cancellation twice when its delete event is processed twice",
      async () => {
        const slotId = "slot-a";
        const {
          organization,
          athletes: [leaving, staying],
        } = await setUp([slotId], 2);
        const booking = { date, interval: intervals.short };

        await book(organization, leaving, slotId, booking.interval);
        await book(organization, staying, slotId, booking.interval);
        await waitFor(async () =>
          expect(await getCount(organization, slotId)).toEqual(2)
        );
        await cancel(organization, leaving, slotId);
        await waitFor(async () =>
          expect(await getCount(organization, slotId)).toEqual(1)
        );

        await deliverBookingEvent(
          "countSlotsBookings",
          bookingPath(organization, leaving, slotId),
          booking,
          null
        );

        expect(await getCount(organization, slotId)).toEqual(1);
      }
    );

    testWithEmulator(
      "doesn't count a cancelled booking when its create event is processed after the delete event",
      async () => {
        const slotId = "slot-a";
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);
        const booking = { date, interval: intervals.short };

        await book(organization, athlete, slotId, booking.interval);
        await waitFor(async () =>
          expect(await getCount(organization, slotId)).toEqual(1)
        );
        await cancel(organization, athlete, slotId);
        await waitFor(async () =>
          expect(await getCount(organization, slotId)).toEqual(0)
        );

        // The create event arrives late
        await deliverBookingEvent(
          "countSlotsBookings",
          bookingPath(organization, athlete, slotId),
          null,
          booking
        );

        expect(await getCount(organization, slotId)).toEqual(0);
      }
    );
  });

  describe("createAttendanceForBooking", () => {
    const slotId = "slot-a";

    testWithEmulator(
      "keeps the current booking when the create event of a cancelled booking arrives after the rebooking",
      async () => {
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);

        // Book, cancel and book a different interval (the sequence seen in production on #988)
        await book(organization, athlete, slotId, intervals.short);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.short,
            attendedInterval: intervals.short,
          })
        );
        await cancel(organization, athlete, slotId);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual(
            undefined
          )
        );
        await book(organization, athlete, slotId, intervals.long);
        const want = {
          bookedInterval: intervals.long,
          attendedInterval: intervals.long,
        };
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual(
            want
          )
        );

        // The first create event is processed last
        await deliverBookingEvent(
          "createAttendanceForBooking",
          bookingPath(organization, athlete, slotId),
          null,
          { date, interval: intervals.short }
        );

        expect(await getAttendance(organization, slotId, athlete)).toEqual(
          want
        );
      }
    );

    testWithEmulator(
      "keeps the current booking when the delete event of a cancelled booking arrives after the rebooking",
      async () => {
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);

        await book(organization, athlete, slotId, intervals.short);
        await cancel(organization, athlete, slotId);
        await book(organization, athlete, slotId, intervals.long);
        const want = {
          bookedInterval: intervals.long,
          attendedInterval: intervals.long,
        };
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual(
            want
          )
        );

        await deliverBookingEvent(
          "createAttendanceForBooking",
          bookingPath(organization, athlete, slotId),
          { date, interval: intervals.short },
          null
        );

        expect(await getAttendance(organization, slotId, athlete)).toEqual(
          want
        );
      }
    );

    testWithEmulator(
      "keeps the latest interval when interval change events are processed in reverse order",
      async () => {
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);

        await book(organization, athlete, slotId, intervals.short);
        await book(organization, athlete, slotId, intervals.long);
        const want = {
          bookedInterval: intervals.long,
          attendedInterval: intervals.long,
        };
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual(
            want
          )
        );

        await deliverBookingEvent(
          "createAttendanceForBooking",
          bookingPath(organization, athlete, slotId),
          null,
          { date, interval: intervals.short }
        );

        expect(await getAttendance(organization, slotId, athlete)).toEqual(
          want
        );
      }
    );

    testWithEmulator(
      "doesn't overwrite the admin's attended interval when a booking event is processed twice",
      async () => {
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);
        const booking = { date, interval: intervals.long };

        await book(organization, athlete, slotId, booking.interval);
        await waitFor(async () =>
          expect(
            (
              await getAttendance(organization, slotId, athlete)
            )?.bookedInterval
          ).toEqual(intervals.long)
        );
        // Admin records that the athlete left early
        const want = {
          bookedInterval: intervals.long,
          attendedInterval: intervals.short,
        };
        await adminWriteAttendance(organization, slotId, athlete, want);

        await deliverBookingEvent(
          "createAttendanceForBooking",
          bookingPath(organization, athlete, slotId),
          null,
          booking
        );

        expect(await getAttendance(organization, slotId, athlete)).toEqual(
          want
        );
      }
    );

    testWithEmulator(
      "updates the booked interval and keeps the admin's attended interval when the booking changes after an admin edit",
      async () => {
        const {
          organization,
          athletes: [late, absent],
        } = await setUp([slotId], 2);

        await book(organization, late, slotId, intervals.long);
        await book(organization, absent, slotId, intervals.long);
        await waitFor(async () => {
          expect(
            (await getAttendance(organization, slotId, late))?.bookedInterval
          ).toEqual(intervals.long);
          expect(
            (await getAttendance(organization, slotId, absent))?.bookedInterval
          ).toEqual(intervals.long);
        });
        await adminWriteAttendance(organization, slotId, late, {
          bookedInterval: intervals.long,
          attendedInterval: intervals.late,
        });
        await adminWriteAttendance(organization, slotId, absent, {
          bookedInterval: intervals.long,
          attendedInterval: null,
        });

        await book(organization, late, slotId, intervals.short);
        await book(organization, absent, slotId, intervals.short);

        await waitFor(async () => {
          expect(await getAttendance(organization, slotId, late)).toEqual({
            bookedInterval: intervals.short,
            attendedInterval: intervals.late,
          });
          expect(await getAttendance(organization, slotId, absent)).toEqual({
            bookedInterval: intervals.short,
            attendedInterval: null,
          });
        });
      }
    );

    testWithEmulator(
      "moves both intervals when the booking changes before any admin edit",
      async () => {
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);

        await book(organization, athlete, slotId, intervals.long);
        await waitFor(async () =>
          expect(
            (
              await getAttendance(organization, slotId, athlete)
            )?.bookedInterval
          ).toEqual(intervals.long)
        );
        await book(organization, athlete, slotId, intervals.short);

        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.short,
            attendedInterval: intervals.short,
          })
        );
      }
    );

    testWithEmulator(
      "keeps recorded attendance (without the booking) when the booking is cancelled after the admin edit",
      async () => {
        const {
          organization,
          athletes: [attended, absent, untouched],
        } = await setUp([slotId], 3);

        await Promise.all(
          [attended, absent, untouched].map((athlete) =>
            book(organization, athlete, slotId, intervals.long)
          )
        );
        await waitFor(async () => {
          const entries = await Promise.all(
            [attended, absent, untouched].map((athlete) =>
              getAttendance(organization, slotId, athlete)
            )
          );
          expect(entries.map((entry) => entry?.bookedInterval)).toEqual([
            intervals.long,
            intervals.long,
            intervals.long,
          ]);
        });
        await adminWriteAttendance(organization, slotId, attended, {
          bookedInterval: intervals.long,
          attendedInterval: intervals.short,
        });
        await adminWriteAttendance(organization, slotId, absent, {
          bookedInterval: intervals.long,
          attendedInterval: null,
        });

        await Promise.all(
          [attended, absent, untouched].map((athlete) =>
            cancel(organization, athlete, slotId)
          )
        );

        await waitFor(async () => {
          // The attended interval recorded by the admin stays, the booking is gone
          expect(await getAttendance(organization, slotId, attended)).toEqual({
            bookedInterval: null,
            attendedInterval: intervals.short,
          });
          // Absent and not booked: no entry
          expect(await getAttendance(organization, slotId, absent)).toEqual(
            undefined
          );
          // No admin edit: the entry goes with the booking
          expect(await getAttendance(organization, slotId, untouched)).toEqual(
            undefined
          );
          // Attended without a booking: the lesson is in the athlete's calendar
          expect(await getAttendedSlot(organization, slotId, attended)).toEqual(
            { date, interval: intervals.short }
          );
        });
        expect(await getAttendedSlot(organization, slotId, absent)).toEqual(
          undefined
        );
        expect(await getAttendedSlot(organization, slotId, untouched)).toEqual(
          undefined
        );

        // The admin corrects the absence: the athlete came after all (`markAttendance` for an athlete without
        // an entry writes `bookedInterval: null`)
        await adminWriteAttendance(organization, slotId, absent, {
          bookedInterval: null,
          attendedInterval: intervals.late,
        });
        await waitFor(async () => {
          expect(await getAttendance(organization, slotId, absent)).toEqual({
            bookedInterval: null,
            attendedInterval: intervals.late,
          });
          expect(await getAttendedSlot(organization, slotId, absent)).toEqual({
            date,
            interval: intervals.late,
          });
        });
      }
    );

    testWithEmulator(
      "keeps an admin absence through a booking change, but not through a cancellation",
      async () => {
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);

        await book(organization, athlete, slotId, intervals.long);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.long,
            attendedInterval: intervals.long,
          })
        );
        await adminWriteAttendance(organization, slotId, athlete, {
          bookedInterval: intervals.long,
          attendedInterval: null,
        });

        await book(organization, athlete, slotId, intervals.short);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.short,
            attendedInterval: null,
          })
        );

        // Absent without a booking is no entry. Booking again gets the automatic value.
        // (Known limitation: cancelling and booking again within seconds can keep or drop the absence, depending on
        // the order the events are processed in.)
        await cancel(organization, athlete, slotId);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual(
            undefined
          )
        );
        await book(organization, athlete, slotId, intervals.long);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.long,
            attendedInterval: intervals.long,
          })
        );
      }
    );

    testWithEmulator(
      "reads partial entries (missing fields, allowed by the rules) and rewrites them complete",
      async () => {
        const {
          organization,
          athletes: [missingAttended, missingBooked],
        } = await setUp([slotId], 2);
        const attendanceRef = adminDb.doc(
          getAttendanceDocPath(organization, slotId)
        );

        await book(organization, missingAttended, slotId, intervals.long);
        await book(organization, missingBooked, slotId, intervals.long);
        await waitFor(async () => {
          expect(
            (await getAttendance(organization, slotId, missingAttended))
              ?.bookedInterval
          ).toEqual(intervals.long);
          expect(
            (await getAttendance(organization, slotId, missingBooked))
              ?.bookedInterval
          ).toEqual(intervals.long);
        });

        // Partial entries written by an admin
        await attendanceRef.update({
          [`attendances.${missingAttended.id}`]: {
            bookedInterval: intervals.long,
          },
          [`attendances.${missingBooked.id}`]: {
            attendedInterval: intervals.late,
          },
        });

        await waitFor(async () => {
          // No attended interval on a booked entry: the automatic value
          expect(
            await getAttendance(organization, slotId, missingAttended)
          ).toEqual({
            bookedInterval: intervals.long,
            attendedInterval: intervals.long,
          });
          // The booked interval comes from the booking, the admin's attended interval is kept
          expect(
            await getAttendance(organization, slotId, missingBooked)
          ).toEqual({
            bookedInterval: intervals.long,
            attendedInterval: intervals.late,
          });
        });

        // A booking change on a partial entry (written again, the guard leaves an unchanged booked part alone)
        await attendanceRef.update({
          [`attendances.${missingAttended.id}`]: {
            bookedInterval: intervals.long,
          },
        });
        await book(organization, missingAttended, slotId, intervals.short);
        await waitFor(async () =>
          expect(
            await getAttendance(organization, slotId, missingAttended)
          ).toEqual({
            bookedInterval: intervals.short,
            attendedInterval: intervals.short,
          })
        );
      }
    );

    testWithEmulator(
      "keeps the admin's attended interval when an athlete marked as attended (without booking) books the slot",
      async () => {
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);

        await adminWriteAttendance(organization, slotId, athlete, {
          bookedInterval: null,
          attendedInterval: intervals.late,
        });
        await book(organization, athlete, slotId, intervals.long);

        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.long,
            attendedInterval: intervals.late,
          })
        );
      }
    );
  });

  describe("admin attendance writes", () => {
    const slotId = "slot-a";

    testWithEmulator(
      "corrects a booked interval written from the admin's stale copy of the attendance",
      async () => {
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);

        await book(organization, athlete, slotId, intervals.long);
        await waitFor(async () =>
          expect(
            (
              await getAttendance(organization, slotId, athlete)
            )?.bookedInterval
          ).toEqual(intervals.long)
        );
        // The athlete changes the interval...
        await book(organization, athlete, slotId, intervals.short);
        await waitFor(async () =>
          expect(
            (
              await getAttendance(organization, slotId, athlete)
            )?.bookedInterval
          ).toEqual(intervals.short)
        );
        // ...while the admin, still seeing the old booking, records a late arrival
        await adminWriteAttendance(organization, slotId, athlete, {
          bookedInterval: intervals.long,
          attendedInterval: intervals.late,
        });

        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.short,
            attendedInterval: intervals.late,
          })
        );
      }
    );

    testWithEmulator(
      "restores a booking's attendance entry dropped by the admin rewriting the attendance from a stale copy",
      async () => {
        const {
          organization,
          athletes: [early, late, absent],
        } = await setUp([slotId], 3);

        await book(organization, early, slotId, intervals.long);
        await book(organization, absent, slotId, intervals.long);
        await waitFor(async () => {
          expect(
            await getAttendance(organization, slotId, early)
          ).toBeDefined();
          expect(
            await getAttendance(organization, slotId, absent)
          ).toBeDefined();
        });
        // The admin's copy of the attendance document, before the next booking
        const staleCopy = (
          await adminDb.doc(getAttendanceDocPath(organization, slotId)).get()
        ).data()!;

        await book(organization, late, slotId, intervals.short);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, late)).toBeDefined()
        );

        // Marking absence rewrites the whole document from the admin's copy (`markAbsence`)
        await adminDb.doc(getAttendanceDocPath(organization, slotId)).set({
          ...staleCopy,
          attendances: {
            ...staleCopy.attendances,
            [absent.id]: {
              bookedInterval: intervals.long,
              attendedInterval: null,
            },
          },
        });

        await waitFor(async () => {
          expect(await getAttendance(organization, slotId, late)).toEqual({
            bookedInterval: intervals.short,
            attendedInterval: intervals.short,
          });
          expect(await getAttendance(organization, slotId, absent)).toEqual({
            bookedInterval: intervals.long,
            attendedInterval: null,
          });
        });
      }
    );

    testWithEmulator(
      "clears the booked interval of an admin write from a copy older than the cancellation",
      async () => {
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);

        await book(organization, athlete, slotId, intervals.long);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.long,
            attendedInterval: intervals.long,
          })
        );
        await cancel(organization, athlete, slotId);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual(
            undefined
          )
        );

        // The admin, still seeing the booking, records a late arrival
        await adminWriteAttendance(organization, slotId, athlete, {
          bookedInterval: intervals.long,
          attendedInterval: intervals.late,
        });

        await waitFor(async () => {
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: null,
            attendedInterval: intervals.late,
          });
          expect(await getAttendedSlot(organization, slotId, athlete)).toEqual({
            date,
            interval: intervals.late,
          });
        });
      }
    );

    testWithEmulator(
      "uses the booking under the current secret key when older bookings documents hold one for the same slot",
      async () => {
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);
        const older = { ...athlete, secretKey: uuid() };
        await adminDb
          .doc(getBookingsDocPath(organization, older.secretKey))
          .set(sanitizeCustomer(older));

        // Booked under the older key, then under the current one (the customer's secret key)
        await book(organization, older, slotId, intervals.long);
        await waitFor(async () =>
          expect(
            (
              await getAttendance(organization, slotId, athlete)
            )?.bookedInterval
          ).toEqual(intervals.long)
        );
        await book(organization, athlete, slotId, intervals.short);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.short,
            attendedInterval: intervals.short,
          })
        );

        // A later change under the older key doesn't win over the current key
        await book(organization, older, slotId, intervals.late);
        await deliverBookingEvent(
          "createAttendanceForBooking",
          bookingPath(organization, older, slotId),
          { date, interval: intervals.long },
          { date, interval: intervals.late }
        );
        expect(await getAttendance(organization, slotId, athlete)).toEqual({
          bookedInterval: intervals.short,
          attendedInterval: intervals.short,
        });

        // Without the current key's booking, the older key's booking counts
        await cancel(organization, athlete, slotId);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.late,
            attendedInterval: intervals.late,
          })
        );
      }
    );

    testWithEmulator(
      "finds a booking held under an older bookings document of the athlete",
      async () => {
        const {
          organization,
          athletes: [athlete],
        } = await setUp([slotId], 1);

        // The athlete's secret key was changed: the booking is under the older bookings document
        const older = { ...athlete, secretKey: uuid() };
        await adminDb
          .doc(getBookingsDocPath(organization, older.secretKey))
          .set(sanitizeCustomer(older));
        await book(organization, older, slotId, intervals.long);
        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.long,
            attendedInterval: intervals.long,
          })
        );

        await adminWriteAttendance(organization, slotId, athlete, {
          bookedInterval: intervals.short,
          attendedInterval: intervals.late,
        });

        await waitFor(async () =>
          expect(await getAttendance(organization, slotId, athlete)).toEqual({
            bookedInterval: intervals.long,
            attendedInterval: intervals.late,
          })
        );
      }
    );
  });
});
