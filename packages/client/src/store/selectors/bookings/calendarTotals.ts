import { DateTime } from "luxon";

import {
  CustomerBookingEntry,
  SlotInterface,
  getIntervalMinutes,
} from "@eisbuk/shared";
import type {
  CalendarDay,
  CalendarSession,
  CalendarWeek,
  ExcludedBooking,
  MonthBookingsSummary,
} from "@eisbuk/ui";

import { LocalStore } from "@/types/store";

import { getCalendarDay } from "@/store/selectors/app";
import { getAttendedSlots, getBookedSlots } from "./slots";

/** A calendar session carrying the full slot, as needed by the cancel booking dialog */
export type CalendarSlotSession = SlotInterface & CalendarSession;

type BookingEntries = Record<
  string,
  Pick<CustomerBookingEntry, "date" | "interval" | "bookingNotes">
>;

interface SummarizeMonthParams {
  /** Month to summarize, e.g. `"2026-10"` */
  month: string;
  /** Athlete's bookings (`bookedSlots`), keyed by slot id */
  bookedSlots: BookingEntries;
  /** Athlete's attendance recorded without a booking (`attendedSlots`), keyed by slot id */
  attendedSlots?: BookingEntries;
  /**
   * Lessons of the month, keyed by date, then slot id (the month entry of `slotsByDay`).
   * `undefined` if not loaded yet.
   */
  slotsForMonth?: Record<string, Record<string, SlotInterface>>;
}

/**
 * Summarizes the athlete's booked time for a month, from the booked intervals (`bookedSlots`).
 *
 * - Durations are summed as whole minutes (see `getIntervalMinutes`), formatting is left to the view.
 * - The counted minutes come from the booked interval itself, so a booking still counts if its interval
 *   was later removed from the lesson (the same interval is what the admin summary reads from attendance).
 * - Bookings whose lesson no longer exists on the booked date, or whose interval can't be read, aren't counted
 *   and are returned in `excluded`, so that the view can say so.
 * - Attended-only entries are shown on their day, but never counted.
 * - Weeks start on Monday and contain only the days of the month, so a week spanning two months is split
 *   between them, and the weeks' minutes always add up to the month's minutes.
 *
 * Dates are calendar dates without a time zone: the date arithmetic runs in UTC so that
 * daylight saving changes (e.g. the last Sunday of October in Europe/Rome) can't shift a day or a week.
 */
export const summarizeMonthBookings = ({
  month,
  bookedSlots,
  attendedSlots = {},
  slotsForMonth,
}: SummarizeMonthParams): MonthBookingsSummary<CalendarSlotSession> => {
  const days = new Map<string, CalendarDay<CalendarSlotSession>>(
    getDaysOfMonth(month).map((date) => [
      date,
      { date, minutes: 0, sessions: [] },
    ])
  );
  const excluded: ExcludedBooking[] = [];
  let bookingsCount = 0;

  const isInMonth = (date: string) =>
    typeof date === "string" && date.substring(0, 7) === month;

  Object.entries(bookedSlots)
    .filter(([, { date }]) => isInMonth(date))
    // If the month's lessons aren't loaded yet, there's nothing to show (nor to report as missing)
    .filter(() => Boolean(slotsForMonth))
    .forEach(([slotId, { date, interval, bookingNotes }]) => {
      const slot = slotsForMonth?.[date]?.[slotId];
      const day = days.get(date);
      if (!slot || !day) {
        excluded.push({ slotId, date, interval, reason: "missing-slot" });
        return;
      }

      const minutes = getIntervalMinutes(interval);
      if (minutes === null) {
        excluded.push({ slotId, date, interval, reason: "invalid-interval" });
        return;
      }

      day.sessions.push({
        ...slot,
        interval: parseInterval(interval),
        minutes,
        booked: true,
        bookingNotes,
      });
      day.minutes += minutes;
      bookingsCount++;
    });

  Object.entries(attendedSlots)
    .filter(([, { date }]) => isInMonth(date))
    // Shouldn't happen (attended slots are created only for slots that weren't booked), but don't show the same lesson twice
    .filter(([slotId]) => !bookedSlots[slotId])
    .forEach(([slotId, { date, interval }]) => {
      const slot = slotsForMonth?.[date]?.[slotId];
      const day = days.get(date);
      // Not counted anyway: an attended-only entry that can't be shown is just left out
      if (!slot || !day || getIntervalMinutes(interval) === null) return;

      day.sessions.push({
        ...slot,
        interval: parseInterval(interval),
        minutes: 0,
        booked: false,
      });
    });

  days.forEach((day) => day.sessions.sort(compareSessions));

  const weeks = groupIntoWeeks([...days.values()]);
  const minutes = weeks.reduce((acc, week) => acc + week.minutes, 0);

  return {
    month,
    minutes,
    bookingsCount,
    weeks,
    excluded: excluded.sort((a, b) => (a.date < b.date ? -1 : 1)),
  };
};

/**
 * Month booked-time summary for the athlete's calendar view (month taken from the calendar date in store).
 */
export const getMonthBookingsSummary = (
  state: LocalStore
): MonthBookingsSummary<CalendarSlotSession> => {
  const month = getCalendarDay(state).toISO().substring(0, 7);
  const slotsByDay = state.firestore.data.slotsByDay || {};

  return summarizeMonthBookings({
    month,
    bookedSlots: getBookedSlots(state),
    attendedSlots: getAttendedSlots(state),
    slotsForMonth: slotsByDay[month],
  });
};

// #region helpers
/**
 * Returns ISO dates of all days in a month (`"YYYY-MM"`)
 */
const getDaysOfMonth = (month: string): string[] => {
  const first = DateTime.fromISO(`${month}-01`, { zone: "utc" });
  if (!first.isValid) return [];

  return Array.from(
    { length: first.daysInMonth },
    (_, i) => first.plus({ days: i }).toISODate()!
  );
};

/**
 * Groups the (sorted) days of a month into weeks starting on Monday
 */
const groupIntoWeeks = <S extends CalendarSession>(
  days: CalendarDay<S>[]
): CalendarWeek<S>[] =>
  days.reduce((weeks, day) => {
    const isMonday = DateTime.fromISO(day.date, { zone: "utc" }).weekday === 1;
    const currentWeek = weeks[weeks.length - 1];

    if (!currentWeek || isMonday) {
      return [
        ...weeks,
        {
          startDate: day.date,
          endDate: day.date,
          minutes: day.minutes,
          days: [day],
        },
      ];
    }

    currentWeek.endDate = day.date;
    currentWeek.minutes += day.minutes;
    currentWeek.days.push(day);
    return weeks;
  }, [] as CalendarWeek<S>[]);

/**
 * Converts a (validated) interval string to a `{ startTime, endTime }` object, e.g. `"9:00 - 10:00" => { startTime: "09:00", endTime: "10:00" }`
 */
const parseInterval = (interval: string) => {
  const [startTime, endTime] = interval
    .split("-")
    .map((time) => time.trim().padStart(5, "0"));
  return { startTime, endTime };
};

const compareSessions = (a: CalendarSession, b: CalendarSession) =>
  a.interval.startTime.localeCompare(b.interval.startTime) ||
  a.interval.endTime.localeCompare(b.interval.endTime);
// #endregion helpers
