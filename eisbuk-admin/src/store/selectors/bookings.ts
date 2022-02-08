import { DateTime } from "luxon";

import { CustomerBase, CustomerBookingEntry } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import { getIsAdmin } from "@/store/selectors/auth";
import { getCalendarDay } from "./app";
import { BookingCountdown } from "@/enums/translations";

/**
 * Get customer info for bookings from local store
 * @param state Local Redux Store
 * @returns customer data (Bookings meta)
 */
export const getBookingsCustomer = (
  state: LocalStore
): CustomerBase | undefined => {
  // get extended date (if any)
  const bookingsInStore = Object.values(state.firestore?.data.bookings || {});
  if (bookingsInStore.length > 1) {
    /** @TODO */
    // this shouldn't happen in production and we're working on a way to fix it completely
    // this is just a reporting feature in case it happens
    console.error(
      "There seem to be multiple entries in 'firestore.data.bookings' part of the local store"
    );
  }

  return bookingsInStore[0];
};

/**
 * Get subscribed slots from state
 * @param state Local Redux Store
 * @returns record of subscribed slots
 */
export const getBookedSlots = (
  state: LocalStore
): Record<string, CustomerBookingEntry> =>
  state.firestore.data?.bookedSlots || {};

/**
 * A selector used to check if booking is allowed for currently observed slots.
 * This could have been a util, but it is entirely store related so it makes sense to
 * make it a selector
 * @param state redux state
 * @returns {boolean} `true` if admin or period for booking of the slots hasn't passed
 */
export const getIsBookingAllowed = (state: LocalStore): boolean => {
  const isAdmin = getIsAdmin(state);

  // the date in store, we're observing (and potentionally booking)
  // the slots belonging to this date
  const observedDate = getCalendarDay(state);
  // current date
  const correctedDateMonth = getCorrectedDateMonth(5);
  // if corrected date passed over to next month, the booking is not allowed
  const monthDiff = getMonthDiff(observedDate, correctedDateMonth);
  const isLate = monthDiff <= 0;

  const isExtendedPeriod = getIsExtendedPeriod(state);
  const isExtendedDateApplicable = getIsExtendedDateApplicable(state);

  return isAdmin || !isLate || (isExtendedPeriod && isExtendedDateApplicable);
};

export const getShouldDisplayCountdown = (
  state: LocalStore
): {
  message?: BookingCountdown;
  deadline: DateTime;
  month: DateTime;
} => {
  const isAdmin = getIsAdmin(state);

  const now = DateTime.now().startOf("day");

  // we're displaying countdown only if the deadline
  // less than `countdownRange` number of days away
  const countdownRange = 2;

  // number of days between month booking deadline and month start
  /**
   * @TODO this is explicit (fixed) and in the furute we want this to be
   * read from store (as set by admin preferences)
   */
  const lockingPeriod = 5;

  // a month we're counting down for
  const month = getCorrectedDateMonth(lockingPeriod, countdownRange);
  const isoMonth = month.toISODate().substring(0, 7);

  // check if at least one slot has been booked for a month
  const bookedSlots = state.firestore.data.bookedSlots || {};
  const isMonthBooked = Boolean(
    Object.values(bookedSlots).find((booking) =>
      booking.date.includes(isoMonth)
    )
  );

  // generate countdown message (or return undefined if shouldn't display countdown)
  let message: undefined | BookingCountdown = undefined;
  // start deadline as first countdown deadline and update later if `extendedDate` period
  let deadline = month.minus({ days: lockingPeriod }).startOf("day");

  // check if first deadline
  const daysUntilDeadline = deadline.diff(now, ["days"]).days;
  const firstDeadlineCountdown =
    !isMonthBooked &&
    daysUntilDeadline <= countdownRange &&
    daysUntilDeadline > 0;

  // check if second deadline
  const secondDeadlineCountdown = getIsExtendedPeriod(state);

  if (isAdmin) {
    // we're not showing the countdown to the admin
    // so this block is empty (we're leaving countdown message as undefined)
  } else if (firstDeadlineCountdown) {
    message = BookingCountdown.FirstDeadline;
  } else if (secondDeadlineCountdown) {
    message = BookingCountdown.SecondDeadline;
    deadline = getExtendedDate(state)!;
  }

  return {
    message,
    deadline,
    month,
  };
};

/**
 * Gets current date (`DateTime.now()`) corrected
 * by adding bookings `lockingPeriod` and optional `countdownRange`
 * @param {number} lockingPeriod number of days between month booking deadline and month start
 * @param {number} countdownRange (optional) number of days prior to booking deadline when we start showing countdown
 * @returns first day of the corrected month
 */
const getCorrectedDateMonth = (lockingPeriod: number, countdownRange = 0) => {
  // current date
  const now = DateTime.now();

  // current date corrected by the period of locking
  // the next month
  return now.plus({ days: lockingPeriod + countdownRange }).startOf("month");
};

/** Returns a rounded down difference between two months */
const getMonthDiff = (d1: DateTime, d2: DateTime): number => {
  // correct dates to start of their respective months
  const cd1 = d1.startOf("month");
  const cd2 = d2.startOf("month");

  return Math.floor(cd1.diff(cd2.startOf("month"), "months").months);
};

const getIsExtendedPeriod = (state: LocalStore): boolean => {
  // current date
  const now = DateTime.now();

  // get extended date (if any)
  const bookingsInStore = Object.values(state.firestore.data.bookings || {});
  const { extendedDate } = bookingsInStore[0] || {};

  // check if extended date exists
  if (!extendedDate) return false;

  // check if extended has passed
  const extendedDateLuxon = DateTime.fromISO(extendedDate).endOf("day");
  return now.diff(extendedDateLuxon, "milliseconds").milliseconds < 0;
};

const getIsExtendedDateApplicable = (state: LocalStore) => {
  // the date in store, we're observing (and potentionally booking)
  // the slots belonging to this date
  const observedDate = getCalendarDay(state);

  // check if extended date is aplicable to the observed month:
  // month of the corrected date (if first deadline has passed)
  // should be the same as the month of the observed date
  // if `extendedDate` is aplicable to the given month
  const correctedDate = getCorrectedDateMonth(5);
  const monthDiff = getMonthDiff(correctedDate, observedDate);
  return monthDiff === 0;
};

const getExtendedDate = (state: LocalStore): DateTime | undefined => {
  const { extendedDate } = getBookingsCustomer(state) || {};

  // check if extended date exists
  if (!extendedDate) return undefined;

  return DateTime.fromISO(extendedDate).endOf("day");
};
