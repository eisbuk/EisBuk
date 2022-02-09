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

/**
 * Check if countdown UI should be shown (for either first deadline or the second one)
 * @param state
 * @returns message, deadline and month for notification UI, `false` if no countdown should be shown
 */
export const getShouldDisplayCountdown = (
  state: LocalStore
):
  | {
      message: BookingCountdown;
      deadline: DateTime;
      month: DateTime;
    }
  | false => {
  // return early if admin (con countdown is shown)
  const isAdmin = getIsAdmin(state);
  if (isAdmin) {
    return false;
  }

  const now = DateTime.now().startOf("day");

  /**
   * @TODO this is explicit (fixed) and in the future we want this to be
   * read from store (as set by admin preferences)
   */
  const countdownRange = 2;
  const lockingPeriod = 5;

  // a month we're counting down for
  const month = getCorrectedDateMonth(lockingPeriod, countdownRange);

  // check if first deadline
  const firstDeadline = month.minus({ days: lockingPeriod }).startOf("day");
  const daysUntilDeadline = firstDeadline.diff(now, ["days"]).days;

  const isFirstDeadline =
    // we're not showing the first countdown if the customer has booked some slots for a month
    !checkMonthHasBookedSlots(state, month) &&
    // we're displaying countdown only if the deadline is
    // less than `countdownRange` number of days away from current date
    daysUntilDeadline <= countdownRange &&
    daysUntilDeadline > 0;

  // check if second deadline
  const isSecondDeadline = getIsExtendedPeriod(state);

  switch (true) {
    case isFirstDeadline:
      return {
        message: BookingCountdown.FirstDeadline,
        month,
        deadline: firstDeadline,
      };
    case isSecondDeadline:
      return {
        message: BookingCountdown.SecondDeadline,
        month,
        deadline: getExtendedDate(state)!,
      };
    default:
      return false;
  }
};

/**
 * Gets current date (`DateTime.now()`) corrected
 * by adding bookings `lockingPeriod` and optional `countdownRange`
 * @param {number} lockingPeriod number of days between month booking deadline and month start
 * @param {number} countdownRange (optional) number of days prior to booking deadline when we start showing countdown
 * @returns first day of the corrected month
 */
const getCorrectedDateMonth = (
  lockingPeriod: number,
  countdownRange = 0
): DateTime => {
  // current date
  const now = DateTime.now();

  // current date corrected by the period of locking
  // the next month
  return now.plus({ days: lockingPeriod + countdownRange }).startOf("month");
};

/**
 * Returns a rounded down difference between two months
 */
const getMonthDiff = (d1: DateTime, d2: DateTime): number => {
  // correct dates to start of their respective months
  const cd1 = d1.startOf("month");
  const cd2 = d2.startOf("month");

  return Math.floor(cd1.diff(cd2.startOf("month"), "months").months);
};

/**
 * Get's exteneded period from store and check s validity
 * whether it has passed
 * @param state
 * @returns
 */
const getIsExtendedPeriod = (state: LocalStore): boolean => {
  // current date
  const now = DateTime.now();

  // get extended date (if any)
  const extendedDate = getExtendedDate(state);

  // check if extended date exists
  if (!extendedDate) return false;

  // check if extended has passed
  const extendedDateLuxon = extendedDate;
  return now.diff(extendedDateLuxon, "milliseconds").milliseconds < 0;
};

/**
 * Checks if extended date is aplicable to currently observed month.
 * This guards from allowing the booking of the passed months if within
 * extended period (for currently booked month)
 * @param state
 * @returns
 */
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

/**
 * A simple selector, retrieves the end of `extendedDate` from store in luxon `DateTime`
 * format, (if exists). Returns `undefined` otherwise.
 * @param state
 * @returns
 */
const getExtendedDate = (state: LocalStore): DateTime | undefined => {
  const { extendedDate } = getBookingsCustomer(state) || {};

  // check if extended date exists
  if (!extendedDate) return undefined;

  return DateTime.fromISO(extendedDate).endOf("day");
};

/**
 * Check if current customer has at least one slot booked for given
 * month.
 * @param state local store state
 * @param month luxon `DateTime` of month to check
 */
const checkMonthHasBookedSlots = (state: LocalStore, month: DateTime) => {
  const monthISO = month.toISODate().substring(0, 7);
  const bookedSlots = state.firestore.data.bookedSlots || {};

  return Boolean(
    Object.values(bookedSlots).find((booking) =>
      booking.date.includes(monthISO)
    )
  );
};
