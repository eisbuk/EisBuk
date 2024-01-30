import { DateTime } from "luxon";

import { BookingsCountdownVariant, CountdownProps } from "@eisbuk/ui";

import { LocalStore } from "@/types/store";

import { getIsAdmin } from "@/store/selectors/auth";
import { getCalendarDay } from "@/store/selectors/app";
import { getBookingsCustomer } from "./customer";

import { getMonthDiff } from "@/utils/date";

/**
 * A selector used to check if booking is allowed for currently observed slots.
 * @param state redux state
 * @returns {boolean} `true` if admin or period for booking of the slots hasn't passed
 */
export const getIsBookingAllowed =
  (secretKey: string, currentDate: DateTime) =>
  (state: LocalStore): boolean => {
    // admins should always be able to update bookings slots
    if (getIsAdmin(state)) return true;

    const deadline = getMonthDeadline(currentDate);

    const extendedDate = getExtendedDate(secretKey)(state);
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
  (secretKey: string) =>
  (state: LocalStore): CountdownProps | undefined => {
    // return early if admin (no countdown is shown)
    const isAdmin = getIsAdmin(state);
    if (isAdmin) {
      return undefined;
    }

    const currentDate = getCalendarDay(state);

    const month = currentDate.startOf("month");

    if (!getIsBookingAllowed(secretKey, currentDate)(state)) {
      return {
        month,
        deadline: null,
        variant: BookingsCountdownVariant.BookingsLocked,
      };
    }

    const monthsDeadline = getMonthDeadline(currentDate);
    const extendedDate = getExtendedDate(secretKey)(state);

    const isExtendedDateApplicable =
      extendedDate && getMonthDiff(extendedDate, currentDate) === 0;

    if (isExtendedDateApplicable) {
      return {
        month,
        deadline: extendedDate.endOf("day"),
        variant: BookingsCountdownVariant.SecondDeadline,
      };
    } else {
      return {
        month,
        deadline: monthsDeadline,
        variant: BookingsCountdownVariant.FirstDeadline,
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
const getExtendedDate =
  (secretKey: string) =>
  (state: LocalStore): DateTime | undefined => {
    const { extendedDate } = getBookingsCustomer(secretKey)(state) || {};

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
export const getMonthDeadline = (date = DateTime.now()) =>
  date.minus({ months: 1 }).endOf("month").minus({ days: lockingPeriod });
