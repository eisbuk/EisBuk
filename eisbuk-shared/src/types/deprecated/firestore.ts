import { Customer } from "../firestore";

/**
 * Deprecated entry for bookings meta. Now it's `CustomerBase`
 * as each `bookings` entry actually contains customer's base data.
 */
export type DeprecatedBookingsMeta = Pick<Customer, "name"> &
  Pick<Customer, "surname"> &
  Pick<Customer, "category"> & {
    // eslint-disable-next-line camelcase
    customer_id: string;
  };
