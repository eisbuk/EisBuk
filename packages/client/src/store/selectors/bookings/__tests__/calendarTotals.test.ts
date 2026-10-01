import { describe, expect, test, afterEach } from "vitest";
import { DateTime, Settings } from "luxon";

import {
  BookingSubCollection,
  Category,
  SlotInterface,
  SlotType,
} from "@eisbuk/shared";
import type { MonthBookingsSummary } from "@eisbuk/ui";
import {
  deleteLocalDocuments,
  updateLocalDocuments,
} from "@eisbuk/react-redux-firebase-firestore";

import { getNewStore } from "@/store/createStore";

import {
  getMonthBookingsSummary,
  summarizeMonthBookings,
} from "../calendarTotals";

// #region fixtures
// All data here is invented
const createSlot = (
  id: string,
  date: string,
  intervals: string[],
  type = SlotType.Ice
): SlotInterface => ({
  id,
  date,
  type,
  categories: [Category.Competitive],
  notes: "",
  intervals: Object.fromEntries(
    intervals.map((interval) => {
      const [startTime, endTime] = interval.split("-");
      return [interval, { startTime, endTime }];
    })
  ),
});

/** Builds a `slotsByDay` month entry from a list of slots */
const toSlotsForMonth = (slots: SlotInterface[]) =>
  slots.reduce(
    (acc, slot) => ({
      ...acc,
      [slot.date]: { ...acc[slot.date], [slot.id]: slot },
    }),
    {} as Record<string, Record<string, SlotInterface>>
  );

const slots = [
  createSlot("slot-sep-29", "2026-09-29", ["17:00-17:50"]),
  createSlot("slot-oct-02", "2026-10-02", ["16:00-17:50"]),
  createSlot("slot-oct-06-a", "2026-10-06", ["16:10-17:00", "16:10-18:50"]),
  createSlot("slot-oct-06-b", "2026-10-06", ["17:10-18:50"], SlotType.OffIce),
  createSlot("slot-oct-14", "2026-10-14", ["21:00-22:15"]),
  createSlot("slot-oct-25", "2026-10-25", ["17:00-17:50"]),
  createSlot("slot-oct-26", "2026-10-26", ["17:00-17:50"]),
];
const slotsByDay = {
  "2026-09": toSlotsForMonth(slots.filter(({ date }) => date < "2026-10")),
  "2026-10": toSlotsForMonth(slots.filter(({ date }) => date >= "2026-10")),
};

const bookedSlots = {
  "slot-sep-29": { date: "2026-09-29", interval: "17:00-17:50" },
  "slot-oct-02": { date: "2026-10-02", interval: "16:00-17:50" },
  // Two bookings on the same day, booked in reverse order
  "slot-oct-06-b": {
    date: "2026-10-06",
    interval: "17:10-18:50",
    bookingNotes: "Arrivo alle 17:15",
  },
  "slot-oct-06-a": { date: "2026-10-06", interval: "16:10-17:00" },
  "slot-oct-14": { date: "2026-10-14", interval: "21:00-22:15" },
  // Day of the daylight saving change (Europe/Rome, last Sunday of October)
  "slot-oct-25": { date: "2026-10-25", interval: "17:00-17:50" },
  "slot-oct-26": { date: "2026-10-26", interval: "17:00-17:50" },
};
// #endregion fixtures

// #region helpers
const getWeek = (summary: MonthBookingsSummary, startDate: string) =>
  summary.weeks.find((week) => week.startDate === startDate)!;

const getDay = (summary: MonthBookingsSummary, date: string) =>
  summary.weeks.flatMap((w) => w.days).find((day) => day.date === date)!;

const sumOfWeeks = (summary: MonthBookingsSummary) =>
  summary.weeks.reduce((acc, week) => acc + week.minutes, 0);

const sumOfDays = (summary: MonthBookingsSummary) =>
  summary.weeks
    .flatMap((week) => week.days)
    .reduce((acc, day) => acc + day.minutes, 0);
// #endregion helpers

describe("Calendar totals", () => {
  describe("summarizeMonthBookings", () => {
    test("should sum the booked intervals of the month as minutes", () => {
      const summary = summarizeMonthBookings({
        month: "2026-10",
        bookedSlots,
        slotsForMonth: slotsByDay["2026-10"],
      });

      // 110 + 50 + 100 + 75 + 50 + 50
      expect(summary.minutes).toEqual(435);
      expect(summary.bookingsCount).toEqual(6);
      expect(summary.excluded).toEqual([]);
      expect(sumOfWeeks(summary)).toEqual(summary.minutes);
      expect(sumOfDays(summary)).toEqual(summary.minutes);
    });

    test("should split the month into weeks starting on Monday, each limited to the days of the month", () => {
      const summary = summarizeMonthBookings({
        month: "2026-10",
        bookedSlots,
        slotsForMonth: slotsByDay["2026-10"],
      });

      expect(
        summary.weeks.map(({ startDate, endDate, minutes }) => [
          startDate,
          endDate,
          minutes,
        ])
      ).toEqual([
        // October 1st 2026 is a Thursday
        ["2026-10-01", "2026-10-04", 110],
        ["2026-10-05", "2026-10-11", 150],
        ["2026-10-12", "2026-10-18", 75],
        ["2026-10-19", "2026-10-25", 50],
        ["2026-10-26", "2026-10-31", 50],
      ]);
      // Every day of the month is included (for the month overview)
      expect(summary.weeks.flatMap((w) => w.days)).toHaveLength(31);
      expect(getWeek(summary, "2026-10-01").days).toHaveLength(4);
    });

    test("should count a week across two months only with the days of the month in view", () => {
      const september = summarizeMonthBookings({
        month: "2026-09",
        bookedSlots,
        slotsForMonth: slotsByDay["2026-09"],
      });
      const october = summarizeMonthBookings({
        month: "2026-10",
        bookedSlots,
        slotsForMonth: slotsByDay["2026-10"],
      });

      // Week Monday 28 September - Sunday 4 October
      const septemberWeek = september.weeks[september.weeks.length - 1];
      expect(septemberWeek.startDate).toEqual("2026-09-28");
      expect(septemberWeek.endDate).toEqual("2026-09-30");
      expect(septemberWeek.minutes).toEqual(50);

      const octoberWeek = october.weeks[0];
      expect(octoberWeek.startDate).toEqual("2026-10-01");
      expect(octoberWeek.endDate).toEqual("2026-10-04");
      expect(octoberWeek.minutes).toEqual(110);

      expect(september.minutes).toEqual(50);
      expect(sumOfWeeks(september)).toEqual(september.minutes);
    });

    test("should group several bookings on one day, earliest first, with a day total", () => {
      const summary = summarizeMonthBookings({
        month: "2026-10",
        bookedSlots,
        slotsForMonth: slotsByDay["2026-10"],
      });

      const day = getDay(summary, "2026-10-06");
      expect(day.minutes).toEqual(150);
      expect(
        day.sessions.map(({ id, interval, minutes, type, bookingNotes }) => ({
          id,
          interval,
          minutes,
          type,
          bookingNotes,
        }))
      ).toEqual([
        {
          id: "slot-oct-06-a",
          interval: { startTime: "16:10", endTime: "17:00" },
          minutes: 50,
          type: SlotType.Ice,
          bookingNotes: undefined,
        },
        {
          id: "slot-oct-06-b",
          interval: { startTime: "17:10", endTime: "18:50" },
          minutes: 100,
          type: SlotType.OffIce,
          bookingNotes: "Arrivo alle 17:15",
        },
      ]);
    });

    test("should not count a cancelled booking", () => {
      // Cancelling deletes the booking document
      const { ["slot-oct-06-a"]: cancelled, ...afterCancellation } =
        bookedSlots;
      expect(cancelled).toBeDefined();

      const summary = summarizeMonthBookings({
        month: "2026-10",
        bookedSlots: afterCancellation,
        slotsForMonth: slotsByDay["2026-10"],
      });

      expect(summary.minutes).toEqual(435 - 50);
      expect(summary.bookingsCount).toEqual(5);
      expect(getDay(summary, "2026-10-06").sessions).toHaveLength(1);
      expect(getWeek(summary, "2026-10-05").minutes).toEqual(100);
      expect(sumOfWeeks(summary)).toEqual(summary.minutes);
    });

    test("should not count attended-only entries, but show them on their day", () => {
      const slot = createSlot("slot-oct-08", "2026-10-08", ["18:00-18:50"]);
      const summary = summarizeMonthBookings({
        month: "2026-10",
        bookedSlots,
        attendedSlots: {
          "slot-oct-08": { date: "2026-10-08", interval: "18:00-18:50" },
          // Attended entry for a booked slot (shouldn't exist) isn't shown twice
          "slot-oct-14": { date: "2026-10-14", interval: "21:00-22:15" },
        },
        slotsForMonth: toSlotsForMonth([
          ...slots.filter(({ date }) => date >= "2026-10"),
          slot,
        ]),
      });

      expect(summary.minutes).toEqual(435);
      expect(summary.bookingsCount).toEqual(6);

      const day = getDay(summary, "2026-10-08");
      expect(day.minutes).toEqual(0);
      expect(day.sessions).toHaveLength(1);
      expect(day.sessions[0]).toEqual(
        expect.objectContaining({
          id: "slot-oct-08",
          booked: false,
          minutes: 0,
        })
      );
      expect(getDay(summary, "2026-10-14").sessions).toHaveLength(1);
    });

    test("should exclude (and report) bookings with a malformed interval, without distorting the total", () => {
      const summary = summarizeMonthBookings({
        month: "2026-10",
        bookedSlots: {
          ...bookedSlots,
          "slot-oct-14": { date: "2026-10-14", interval: "22:15-21:00" },
          "slot-oct-26": { date: "2026-10-26", interval: "not-an-interval" },
        },
        slotsForMonth: slotsByDay["2026-10"],
      });

      expect(summary.minutes).toEqual(435 - 75 - 50);
      expect(summary.bookingsCount).toEqual(4);
      expect(summary.excluded).toEqual([
        {
          slotId: "slot-oct-14",
          date: "2026-10-14",
          interval: "22:15-21:00",
          reason: "invalid-interval",
        },
        {
          slotId: "slot-oct-26",
          date: "2026-10-26",
          interval: "not-an-interval",
          reason: "invalid-interval",
        },
      ]);
      expect(Number.isInteger(summary.minutes)).toBe(true);
      expect(sumOfWeeks(summary)).toEqual(summary.minutes);
    });

    test("should exclude (and report) bookings whose lesson no longer exists", () => {
      const summary = summarizeMonthBookings({
        month: "2026-10",
        bookedSlots: {
          ...bookedSlots,
          "deleted-slot": { date: "2026-10-20", interval: "17:00-17:50" },
        },
        slotsForMonth: slotsByDay["2026-10"],
      });

      expect(summary.minutes).toEqual(435);
      expect(summary.excluded).toEqual([
        {
          slotId: "deleted-slot",
          date: "2026-10-20",
          interval: "17:00-17:50",
          reason: "missing-slot",
        },
      ]);
    });

    test("should count a booking whose interval was removed from the lesson, with its booked times", () => {
      const summary = summarizeMonthBookings({
        month: "2026-10",
        bookedSlots: {
          ...bookedSlots,
          // The lesson doesn't offer "16:00-16:50" (anymore)
          "slot-oct-02": { date: "2026-10-02", interval: "16:00-16:50" },
        },
        slotsForMonth: slotsByDay["2026-10"],
      });

      expect(summary.minutes).toEqual(435 - 110 + 50);
      expect(summary.excluded).toEqual([]);
      expect(getDay(summary, "2026-10-02").sessions[0].interval).toEqual({
        startTime: "16:00",
        endTime: "16:50",
      });
    });

    test("should return an empty summary (and report nothing) while the month's lessons aren't loaded", () => {
      const summary = summarizeMonthBookings({
        month: "2026-10",
        bookedSlots,
        slotsForMonth: undefined,
      });

      expect(summary.minutes).toEqual(0);
      expect(summary.excluded).toEqual([]);
      expect(summary.weeks).toHaveLength(5);
    });

    test("should handle a month starting on Sunday (single day first week)", () => {
      // November 1st 2026 is a Sunday
      const summary = summarizeMonthBookings({
        month: "2026-11",
        bookedSlots: {
          "slot-nov-01": { date: "2026-11-01", interval: "10:00-10:50" },
        },
        slotsForMonth: toSlotsForMonth([
          createSlot("slot-nov-01", "2026-11-01", ["10:00-10:50"]),
        ]),
      });

      expect(summary.weeks[0]).toEqual(
        expect.objectContaining({
          startDate: "2026-11-01",
          endDate: "2026-11-01",
          minutes: 50,
        })
      );
      expect(summary.weeks[1].startDate).toEqual("2026-11-02");
      expect(summary.weeks[summary.weeks.length - 1].endDate).toEqual(
        "2026-11-30"
      );
    });

    describe("Daylight saving time", () => {
      const defaultZone = Settings.defaultZone;
      afterEach(() => {
        Settings.defaultZone = defaultZone;
      });

      const zones = ["Europe/Rome", "America/Los_Angeles", "Asia/Tokyo"];

      zones.forEach((zone) =>
        test(`should keep days and weeks around the end of October unchanged in time zone ${zone}`, () => {
          Settings.defaultZone = zone;

          const summary = summarizeMonthBookings({
            month: "2026-10",
            bookedSlots,
            slotsForMonth: slotsByDay["2026-10"],
          });

          // Sunday 25 October 2026 is 25 hours long in Europe/Rome: it must still be the last day of its week
          const lastButOneWeek = getWeek(summary, "2026-10-19");
          expect(lastButOneWeek.endDate).toEqual("2026-10-25");
          expect(lastButOneWeek.days.map(({ date }) => date)).toEqual([
            "2026-10-19",
            "2026-10-20",
            "2026-10-21",
            "2026-10-22",
            "2026-10-23",
            "2026-10-24",
            "2026-10-25",
          ]);
          expect(getDay(summary, "2026-10-25").minutes).toEqual(50);
          expect(getWeek(summary, "2026-10-26").days).toHaveLength(6);
          expect(getDay(summary, "2026-10-26").minutes).toEqual(50);
          expect(summary.minutes).toEqual(435);
          expect(summary.weeks.flatMap((w) => w.days)).toHaveLength(31);
        })
      );
    });
  });

  describe("getMonthBookingsSummary", () => {
    test("should update the totals when a booking is added or cancelled in store", () => {
      const store = getNewStore({
        firestore: { data: { slotsByDay, bookedSlots: {} } },
        app: { calendarDay: DateTime.fromISO("2026-10-01") },
      });

      expect(getMonthBookingsSummary(store.getState()).minutes).toEqual(0);

      // Booking (as received from the bookedSlots subscription)
      store.dispatch(
        updateLocalDocuments(BookingSubCollection.BookedSlots, {
          "slot-oct-02": bookedSlots["slot-oct-02"],
          "slot-oct-06-a": bookedSlots["slot-oct-06-a"],
        })
      );
      expect(getMonthBookingsSummary(store.getState()).minutes).toEqual(160);

      // Cancellation
      store.dispatch(
        deleteLocalDocuments(BookingSubCollection.BookedSlots, [
          "slot-oct-06-a",
        ])
      );
      const summary = getMonthBookingsSummary(store.getState());
      expect(summary.minutes).toEqual(110);
      expect(summary.bookingsCount).toEqual(1);
    });

    test("should summarize the month of the calendar date in store", () => {
      const store = getNewStore({
        firestore: { data: { slotsByDay, bookedSlots } },
        app: { calendarDay: DateTime.fromISO("2026-09-15") },
      });
      const summary = getMonthBookingsSummary(store.getState());
      expect(summary.month).toEqual("2026-09");
      expect(summary.minutes).toEqual(50);
    });
  });
});
