import {
  CustomerBookingEntry,
  SlotInterface,
  SlotInterval,
} from "@eisbuk/shared";

/**
 * A single lesson shown in the athlete's calendar.
 * `type` and `notes` come from the lesson, and are missing if the lesson isn't loaded (or no longer exists).
 */
export type CalendarSession = Pick<SlotInterface, "id" | "date"> &
  Partial<Pick<SlotInterface, "type" | "notes">> &
  Pick<CustomerBookingEntry, "bookingNotes"> & {
    /**
     * Times of the session, as booked (or attended).
     */
    interval: SlotInterval;
    /**
     * Lesson hours counted toward the totals, in the club's units (the booked interval rounded up
     * to the next half hour, e.g. 50 minutes = 1 hour), `0` for attended-only entries (those are shown, but aren't bookings).
     */
    hours: number;
    /**
     * `true` for a booking, `false` for attendance recorded without a booking.
     */
    booked: boolean;
  };

export interface CalendarDay<S extends CalendarSession = CalendarSession> {
  /** ISO date, e.g. `"2026-10-05"` */
  date: string;
  /** Booked hours on this day */
  hours: number;
  /** Sessions on this day, earliest first */
  sessions: S[];
}

export interface CalendarWeek<S extends CalendarSession = CalendarSession> {
  /** First day of the week (Monday) within the month */
  startDate: string;
  /** Last day of the week (Sunday) within the month */
  endDate: string;
  /** Booked hours on the days of this week that fall within the month */
  hours: number;
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
   * `invalid-interval` - the booked interval can't be read as a time range
   */
  reason: "invalid-interval";
}

export interface MonthBookingsSummary<
  S extends CalendarSession = CalendarSession
> {
  /** Month, e.g. `"2026-10"` */
  month: string;
  /** Booked hours in the month (always the sum of the weeks' hours) */
  hours: number;
  /** Number of bookings counted in `hours` */
  bookingsCount: number;
  /** Weeks of the month, starting on Monday, each limited to the days of the month */
  weeks: CalendarWeek<S>[];
  /** Bookings of the month that aren't counted (see `ExcludedBooking`) */
  excluded: ExcludedBooking[];
}
