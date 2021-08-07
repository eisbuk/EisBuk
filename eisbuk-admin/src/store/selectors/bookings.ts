import { LocalStore } from "@/types/store";

/**
 * Get customer info for bookings from local store
 * @param state Local Redux Store
 * @returns customer data (Bookings meta)
 */
export const getBookingsCustomer = (
  state: LocalStore
): LocalStore["firestore"]["ordered"]["bookings"] =>
  state.firestore.ordered.bookings;
