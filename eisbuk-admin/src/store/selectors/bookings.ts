import { DateTime } from "luxon";

import { CustomerBase, CustomerBookingEntry } from "eisbuk-shared";

import { BookingCountdownMessage } from "@/enums/translations";

import { LocalStore } from "@/types/store";

import { BookingsCountdownProps } from "@/components/atoms/BookingsCountdown";

import { getIsAdmin } from "@/store/selectors/auth";
import { getCalendarDay } from "./app";

import { getMonthDiff } from "@/utils/date";

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
 * @param state redux state
 * @returns {boolean} `true` if admin or period for booking of the slots hasn't passed
 */
export const getIsBookingAllowed = (state: LocalStore): boolean => {
  // admins should always be able to update bookings slots
  if (getIsAdmin(state)) return true;

  // the date in store, we're observing (and potentionally booking)
  // the slots belonging to this date
  const observedDate = getCalendarDay(state);
  const bookingMonth = getBookingMonth(getExtendedDate(state));
  // if corrected date passed over to next month, the booking is not allowed
  return getMonthDiff(observedDate, bookingMonth) >= 0;
};

/**
 * Get props for bookings countdown UI
 * @param state redux state
 * @returns `undefined` if admin (or should be hidden), otherwise returns an object
 * containing countdown `message`, booking `month`, and countdown `deadline`
 */
export const getCountdownProps = (
  state: LocalStore
): BookingsCountdownProps | undefined => {
  // return early if admin (no countdown is shown)
  const isAdmin = getIsAdmin(state);
  if (isAdmin) {
    return undefined;
  }

  const extendedDate = getExtendedDate(state);

  // first countdown
  // if extended date is not supplied or has passed the current month deadline is applicable
  if (!extendedDate || extendedDate.diffNow().milliseconds < 0) {
    const month = getBookingMonth();
    // deadline for current month exists in previous month (i.e. "2022-01-26" is deadline for "2022-02")
    const deadline = getMonthDeadline(month.minus({ months: 1 }));

    /**
     * @This is a logic for showing of the booking countdown for first deadline only
     * within certain range before the deadline and if no slots are booked
     */
    // const hideCountdown =
    //   // we're showing first countdown only if no slots for a month have been booked
    //   checkMonthHasBookedSlots(state, month) ||
    //   // we're showing first countdown only if current date within countdown range
    //   deadline.diffNow("days").days > countdownRange;

    // if (hideCountdown) {
    //   return undefined;
    // }

    return {
      message: BookingCountdownMessage.FirstDeadline,
      month,
      deadline,
    };
  }

  // second countdown
  // extended date is aplicable
  return {
    message: BookingCountdownMessage.SecondDeadline,
    month: getBookingMonth(extendedDate),
    deadline: extendedDate,
  };
};

// #region temp
/** @TEMP should be read from admin preferences in the store */
const lockingPeriod = 5;
// const countdownRange = 2;
// #region temp

// #region helpers
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

/** @TEMP not using this logic at the time */
// /**
//  * Check if current customer has at least one slot booked for given
//  * month.
//  * @param state local store state
//  * @param month luxon `DateTime` of month to check
//  */
// const checkMonthHasBookedSlots = (state: LocalStore, month: DateTime) => {
//   const monthISO = month.toISODate().substring(0, 7);
//   const bookedSlots = state.firestore.data.bookedSlots || {};

//   return Boolean(
//     Object.values(bookedSlots).find((booking) =>
//       booking.date.includes(monthISO)
//     )
//   );
// };

/**
 * Returns deadline for a current month calculated by subtracting
 * the locking period from month's end
 * @example
 * - date = "2022-01-XX"
 * - daysInMonth = 31 // number of days in January
 * - lockingPeriod = 5 // days
 * - 31 - 5 = 26 // the deadline is on the 26th
 * - deadline = "2022-01-26T23:59:59"
 * @param lockingPeriod
 * @returns
 */
const getMonthDeadline = (date = DateTime.now()) =>
  date.endOf("month").minus({ days: lockingPeriod });

/**
 * Gets first month available for booking with respect to
 * provided (optional) `extendedDate` and current date
 * @param extendedDate
 * @returns
 */
const getBookingMonth = (extendedDate?: DateTime): DateTime => {
  const currentMonthDeadline = getMonthDeadline();

  // if `extendedDate` not provided or has passed, only take current month deadline into account
  if (!extendedDate || extendedDate.diffNow().milliseconds < 0) {
    return currentMonthDeadline.diffNow().milliseconds > 0
      ? // if current month deadline hasn't yet passed, the booking month is, trivially the next month
        currentMonthDeadline.plus({ months: 1 }).startOf("month")
      : // if current month deadline has passed, only the month after the next month is available for booking
        currentMonthDeadline.plus({ months: 2 });
  }

  return extendedDate.diff(currentMonthDeadline).milliseconds < 0
    ? // `extendedDate`, for current month is at the start of the current month
      // i.e. extended date for February is "20XX-02-06"
      extendedDate.startOf("month")
    : // `extendedDate` is an extension of current deadline in the same month (for the next month)
      // i.e. extended date for February is "20XX-01-29" and the deadline for February is "20XX-01-27"
      extendedDate.plus({ months: 1 }).startOf("month");
};
// #endregion helpers
