import {
  CustomerBookingEntry,
  SlotInterface,
  SlotInterval,
} from "@eisbuk/shared";

/**
 * A single lesson shown in the athlete's calendar.
 */
export type CalendarSession = Pick<
  SlotInterface,
  "id" | "date" | "type" | "notes"
> &
  Pick<CustomerBookingEntry, "bookingNotes"> & {
    /**
     * Times of the session, as booked (or attended).
     */
    interval: SlotInterval;
    /**
     * Minutes counted toward the totals: the booked interval's duration for bookings,
     * `0` for attended-only entries (those are shown, but aren't bookings).
     */
    minutes: number;
    /**
     * `true` for a booking, `false` for attendance recorded without a booking.
     */
    booked: boolean;
  };

export interface CalendarDay<S extends CalendarSession = CalendarSession> {
  /** ISO date, e.g. `"2026-10-05"` */
  date: string;
  /** Booked minutes on this day */
  minutes: number;
  /** Sessions on this day, earliest first */
  sessions: S[];
}

export interface CalendarWeek<S extends CalendarSession = CalendarSession> {
  /** First day of the week (Monday) within the month */
  startDate: string;
  /** Last day of the week (Sunday) within the month */
  endDate: string;
  /** Booked minutes on the days of this week that fall within the month */
  minutes: number;
  /** Every day of the week that falls within the month */
  days: CalendarDay<S>[];
}

/**
 * A booking of the month that couldn't be counted, so that it can be reported instead of silently skipped.
 */
export interface ExcludedBooking {
  slotId: string;
  date: string;
  interval: string;
  /**
   * - `missing-slot` - the lesson no longer exists on the booked date
   * - `invalid-interval` - the booked interval can't be read as a time range
   */
  reason: "missing-slot" | "invalid-interval";
}

export interface MonthBookingsSummary<
  S extends CalendarSession = CalendarSession
> {
  /** Month, e.g. `"2026-10"` */
  month: string;
  /** Booked minutes in the month (always the sum of the weeks' minutes) */
  minutes: number;
  /** Number of bookings counted in `minutes` */
  bookingsCount: number;
  /** Weeks of the month, starting on Monday, each limited to the days of the month */
  weeks: CalendarWeek<S>[];
  /** Bookings of the month that aren't counted (see `ExcludedBooking`) */
  excluded: ExcludedBooking[];
}
