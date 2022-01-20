import { CustomerBase, CustomerBookingEntry } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

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
