import { DateTime } from "luxon";

import { CustomerBase, CustomerBookingEntry } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import { getIsAdmin } from "@/store/selectors/auth";
import { getCalendarDay } from "./app";

/**
 * Get customer info for bookings from local store
 * @param state Local Redux Store
 * @returns customer data (Bookings meta)
 */
export const getBookingsCustomer =
  (secretKey: string) =>
  (state: LocalStore): CustomerBase | undefined => {
    const { bookings } = state.firestore.data;
    return bookings ? bookings[secretKey] : undefined;
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
  const actualDate = DateTime.now();
  // current date corrected by the period of locking
  // the next month
  const correctedDate = actualDate.plus({ days: 5 });
  const correctedDateMonth = correctedDate.startOf("month");
  const observedDateMonth = observedDate.startOf("month");
  // if corrected date passed over to next month, the booking is not allowed
  const monthDiff = Math.floor(
    observedDateMonth.diff(correctedDateMonth, ["months"]).months
  );
  const isLate = monthDiff <= 0;

  return isAdmin || !isLate;
};

export const getShouldDisplayCountdown = (
  state: LocalStore
): {
  shouldDisplayCountdown: boolean;
  deadline: DateTime;
  month: string;
} => {
  const now = DateTime.now().startOf("day");

  // we're displaying countdown only if the deadline
  // less than `countdownRange` number of days away
  const countdownRange = 2;

  // We're calculating bookings deadline as `deadlineTillMonthStart` number
  // of days before the month start
  const deadlineTillMonthStart = 5;

  // a month we're counting down for
  const countdownMonth = now.startOf("month").plus({ months: 1 });
  const month = countdownMonth.toISODate().substring(0, 7);

  const deadline = countdownMonth
    .minus({ days: deadlineTillMonthStart })
    .startOf("day");
  const { days: daysUntilDeadline } = deadline.diff(now, ["days"]);

  // check if at least slot has been booked for a month
  const bookedSlots = state.firestore.data.bookedSlots || {};
  const isMonthBooked = Boolean(
    Object.values(bookedSlots).find((booking) => booking.date.includes(month))
  );

  return {
    shouldDisplayCountdown:
      !isMonthBooked &&
      daysUntilDeadline <= countdownRange &&
      daysUntilDeadline > 0,
    deadline,
    month,
  };
};
