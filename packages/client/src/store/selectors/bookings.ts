import { DateTime } from "luxon";

import { CustomerBase, CustomerBookingEntry } from "@eisbuk/shared";

import { BookingCountdownMessage } from "@eisbuk/translations";

import { LocalStore } from "@/types/store";

import { BookingsCountdownProps } from "@/components/atoms/BookingsCountdown";

import { getIsAdmin } from "@/store/selectors/auth";

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
 * Get subscribed slots from state for a specific month
 * @param state Local Redux Store
 * @returns record of subscribed slots
 */
export const getBookedSlotsByMonth =
  (month: number) =>
  (state: LocalStore): Record<string, CustomerBookingEntry> =>
    Object.entries(state.firestore.data?.bookedSlots || {}).reduce(
      (acc, [key, value]) =>
        DateTime.fromISO(value.date).month === month
          ? { ...acc, [key]: value }
          : acc,
      {}
    );

/**
 * A selector used to check if booking is allowed for currently observed slots.
 * @param state redux state
 * @returns {boolean} `true` if admin or period for booking of the slots hasn't passed
 */
export const getIsBookingAllowed =
  (currentDate: DateTime) =>
  (state: LocalStore): boolean => {
    // admins should always be able to update bookings slots
    if (getIsAdmin(state)) return true;

    const deadline = getMonthDeadline(currentDate);

    const extendedDate = getExtendedDate(state);
    const isExtendedDateAplicable = Boolean(
      extendedDate &&
        extendedDate.diffNow().milliseconds > 0 &&
        getMonthDiff(extendedDate, currentDate) === 0
    );

    return deadline.diffNow().milliseconds > 0 || isExtendedDateAplicable;
  };

/**
 * Get props for bookings countdown UI
 * @param state redux state
 * @returns `undefined` if admin (or should be hidden), otherwise returns an object
 * containing countdown `message`, booking `month`, and countdown `deadline`
 */
export const getCountdownProps =
  (currentDate: DateTime) =>
  (state: LocalStore): BookingsCountdownProps | undefined => {
    // return early if admin (no countdown is shown)
    const isAdmin = getIsAdmin(state);
    if (isAdmin) {
      return undefined;
    }

    const month = currentDate.startOf("month");

    if (!getIsBookingAllowed(currentDate)(state)) {
      return {
        month,
        deadline: null,
        message: BookingCountdownMessage.BookingsLocked,
      };
    }

    const monthsDeadline = getMonthDeadline(currentDate);
    const extendedDate = getExtendedDate(state);

    const isExtendedDateAplicable =
      extendedDate && getMonthDiff(extendedDate, currentDate) === 0;

    if (isExtendedDateAplicable) {
      return {
        month,
        deadline: extendedDate.endOf("day"),
        message: BookingCountdownMessage.SecondDeadline,
      };
    } else {
      return {
        month,
        deadline: monthsDeadline,
        message: BookingCountdownMessage.FirstDeadline,
      };
    }
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

/**
 * Returns deadline for a current month calculated by subtracting
 * the locking period from the end of pervious month
 * @example
 * - date = "2022-02-XX"
 * - daysPrevInMonth = 31 // number of days in January
 * - lockingPeriod = 5 // days
 * - 31 - 5 = 26 // the deadline is on the 26th
 * - deadline = "2022-01-26T23:59:59"
 * @param lockingPeriod
 * @returns
 */
const getMonthDeadline = (date = DateTime.now()) =>
  date.minus({ months: 1 }).endOf("month").minus({ days: lockingPeriod });

// /**
//  * Gets first month available for booking with respect to
//  * provided (optional) `extendedDate` and current date
//  * @param extendedDate
//  * @returns
//  */
// const getBookingMonth = (extendedDate?: DateTime): DateTime => {
//   const currentMonthDeadline = getMonthDeadline();

//   // if `extendedDate` not provided or has passed, only take current month deadline into account
//   if (!extendedDate || extendedDate.diffNow().milliseconds < 0) {
//     return currentMonthDeadline.diffNow().milliseconds > 0
//       ? // if current month deadline hasn't yet passed, the booking month is, trivially the next month
//         currentMonthDeadline.plus({ months: 1 }).startOf("month")
//       : // if current month deadline has passed, only the month after the next month is available for booking
//         currentMonthDeadline.plus({ months: 2 });
//   }

//   return extendedDate.diff(currentMonthDeadline).milliseconds < 0
//     ? // `extendedDate`, for current month is at the start of the current month
//       // i.e. extended date for February is "20XX-02-06"
//       extendedDate.startOf("month")
//     : // `extendedDate` is an extension of current deadline in the same month (for the next month)
//       // i.e. extended date for February is "20XX-01-29" and the deadline for February is "20XX-01-27"
//       extendedDate.plus({ months: 1 }).startOf("month");
// };
// // #endregion helpers
