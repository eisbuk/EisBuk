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
  const actualDate = DateTime.fromMillis(Date.now());
  // current date corrected by the period of locking
  // the next month
  const correctedDate = actualDate.plus({ days: 5 });
  // if corrected date passed over to next month, the booking is not allowed
  const monthDiff = Math.floor(
    observedDate.diff(correctedDate, ["months"]).months
  );
  const isLate = monthDiff <= 0;

  return isAdmin || !isLate;
};
