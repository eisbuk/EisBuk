import { Customer } from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

/**
 * Get bookings customer (for the provided secretKey) from store.
 * Since we support multiple accounts for single auth, there might be mutilple bookings
 * customers in store, hence this HOF (accepting secretKey) and returning a selector.
 */
export const getBookingsCustomer =
  (secretKey: string) =>
  (state: LocalStore): Customer =>
    (state.firestore?.data.bookings || {})[secretKey];

/**
 * Returns all bookings customers currently present in store.
 */
export const getAllBookingsAccounts = (state: LocalStore): Customer[] =>
  Object.values(state.firestore.data.bookings || {});

/**
 * Returns all bookings customers currently present in store, except for the "current" one (matched by passed secret key).
 * @param currentSecretKey
 */
export const getOtherBookingsAccounts =
  (currentSecretKey: string) =>
  (state: LocalStore): Customer[] =>
    getAllBookingsAccounts(state).filter(
      ({ secretKey }) => secretKey !== currentSecretKey
    );
