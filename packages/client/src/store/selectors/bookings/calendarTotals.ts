import { DateTime } from "luxon";

import {
  CustomerBookingEntry,
  SlotInterface,
  calculateIntervalDuration,
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

/**
 * Lesson hours a booked interval counts for, in every total of the athlete's calendar (session, day, week, month),
 * or `null` if the interval can't be read (the booking is then reported as excluded).
 *
 * The club's convention, shared with the admin monthly summary: each booking is rounded up to the next
 * half hour by `calculateIntervalDuration` (50 or 60 minutes = 1 hour, 61-90 = 1.5, 91-120 = 2, ...),
 * then the bookings are summed. `getIntervalMinutes` is only used to reject malformed intervals
 * (for which `calculateIntervalDuration` would return `NaN` or a negative number).
 */
export const getCountedHours = (interval: string): number | null =>
  getIntervalMinutes(interval) === null
    ? null
    : calculateIntervalDuration(interval);

/**
 * A calendar session, with the lesson's data (type, notes...) when the lesson is loaded.
 * The cancel booking dialog needs `id`, `date` and `interval` only.
 */
export type CalendarSlotSession = CalendarSession & Partial<SlotInterface>;

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
   * Lessons of the month, keyed by date, then slot id (the month entry of `slotsByDay`), if loaded.
   * Only used to show the lessons' type and notes: the totals don't depend on it.
   */
  slotsForMonth?: Record<string, Record<string, SlotInterface>>;
}

/**
 * Summarizes the athlete's booked time for a month, from the booking documents themselves (`bookedSlots`),
 * each with its own `date` and `interval`.
 *
 * - Each booking counts for its lesson hours (see `getCountedHours`), summed (in steps of half an hour,
 *   so the sums are exact), formatting is left to the view.
 * - The lesson (`slotsByDay`) is only used to show its type and notes, when available: a booking whose lesson
 *   isn't loaded, or no longer exists, still counts and is shown with its booked date and times.
 * - Only bookings whose interval can't be read aren't counted: they're returned in `excluded`, so that the view can say so.
 * - Attended-only entries are shown on their day, but never counted.
 * - Weeks start on Monday and contain only the days of the month, so a week spanning two months is split
 *   between them, and the weeks' hours always add up to the month's hours.
 *
 * Dates are calendar dates without a time zone: the date arithmetic runs in UTC so that
 * daylight saving changes (e.g. the last Sunday of October in Europe/Rome) can't shift a day or a week.
 */
export const summarizeMonthBookings = ({
  month,
  bookedSlots,
  attendedSlots = {},
  slotsForMonth = {},
}: SummarizeMonthParams): MonthBookingsSummary<CalendarSlotSession> => {
  const days = new Map<string, CalendarDay<CalendarSlotSession>>(
    getDaysOfMonth(month).map((date) => [
      date,
      { date, hours: 0, sessions: [] },
    ])
  );
  const excluded: ExcludedBooking[] = [];
  let bookingsCount = 0;

  Object.entries(bookedSlots).forEach(
    ([slotId, { date, interval, bookingNotes }]) => {
      const day = days.get(date);
      // Not a day of this month
      if (!day) return;

      const hours = getCountedHours(interval);
      if (hours === null) {
        excluded.push({ slotId, date, interval, reason: "invalid-interval" });
        return;
      }

      day.sessions.push({
        // The lesson's data (type, notes), if available
        ...slotsForMonth[date]?.[slotId],
        id: slotId,
        date,
        interval: parseInterval(interval),
        hours,
        booked: true,
        bookingNotes,
      });
      day.hours += hours;
      bookingsCount++;
    }
  );

  Object.entries(attendedSlots)
    // Shouldn't happen (attended slots are created only for slots that weren't booked), but don't show the same lesson twice
    .filter(([slotId]) => !bookedSlots[slotId])
    .forEach(([slotId, { date, interval }]) => {
      const day = days.get(date);
      // Not counted anyway: an attended-only entry that can't be shown is just left out
      if (!day || getIntervalMinutes(interval) === null) return;

      day.sessions.push({
        ...slotsForMonth[date]?.[slotId],
        id: slotId,
        date,
        interval: parseInterval(interval),
        hours: 0,
        booked: false,
      });
    });

  days.forEach((day) => day.sessions.sort(compareSessions));

  const weeks = groupIntoWeeks([...days.values()]);
  const hours = weeks.reduce((acc, week) => acc + week.hours, 0);

  return {
    month,
    hours,
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

  return summarizeMonthBookings({
    month,
    bookedSlots: getBookedSlots(state),
    attendedSlots: getAttendedSlots(state),
    // Lessons, if loaded, only to show their type and notes
    slotsForMonth: state.firestore.data.slotsByDay?.[month],
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
          hours: day.hours,
          days: [day],
        },
      ];
    }

    currentWeek.endDate = day.date;
    currentWeek.hours += day.hours;
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
