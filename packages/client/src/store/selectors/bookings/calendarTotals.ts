import { DateTime } from "luxon";

import {
  CustomerBookingEntry,
  OrgSubCollection,
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
   * `undefined` if not loaded yet, empty if the month has no document (every booking of the month is then excluded).
   */
  slotsForMonth?: Record<string, Record<string, SlotInterface>>;
}

/**
 * Summarizes the athlete's booked time for a month, from the booked intervals (`bookedSlots`).
 *
 * - Each booking counts for its lesson hours (see `getCountedHours`), summed (in steps of half an hour,
 *   so the sums are exact), formatting is left to the view.
 * - The counted hours come from the booked interval itself, so a booking still counts if its interval
 *   was later removed from the lesson (the same interval is what the admin summary reads from attendance).
 * - Bookings whose lesson no longer exists on the booked date, or whose interval can't be read, aren't counted
 *   and are returned in `excluded`, so that the view can say so.
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
  slotsForMonth,
}: SummarizeMonthParams): MonthBookingsSummary<CalendarSlotSession> => {
  const days = new Map<string, CalendarDay<CalendarSlotSession>>(
    getDaysOfMonth(month).map((date) => [
      date,
      { date, hours: 0, sessions: [] },
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

      const hours = getCountedHours(interval);
      if (hours === null) {
        excluded.push({ slotId, date, interval, reason: "invalid-interval" });
        return;
      }

      day.sessions.push({
        ...slot,
        interval: parseInterval(interval),
        hours,
        booked: true,
        bookingNotes,
      });
      day.hours += hours;
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
    slotsForMonth: getSlotsForMonth(state, month),
  });
};

/**
 * Lessons of a month (the month's `slotsByDay` document):
 * - `undefined` while the document is loading
 * - an empty record if the document doesn't exist (e.g. removed by `pruneSlotsByDay` after the month's
 *   last lesson was deleted), so that any remaining bookings of the month are reported, not hidden
 */
const getSlotsForMonth = (
  state: LocalStore,
  month: string
): SummarizeMonthParams["slotsForMonth"] => {
  const slotsForMonth = state.firestore.data.slotsByDay?.[month];
  if (slotsForMonth) return slotsForMonth;

  const receivedDocuments =
    state.firestore.listeners[OrgSubCollection.SlotsByDay]?.receivedDocuments ||
    [];
  return receivedDocuments.includes(month) ? {} : undefined;
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
