import { Customer } from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

/**
 * Get customer info for bookings from local store
 * @param state Local Redux Store
 * @returns customer data (Bookings meta)
 */
export const getBookingsCustomer = (
  state: LocalStore
): Omit<Customer, "secretKey"> | undefined => {
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
