import { SlotInterface } from "../firestore";
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

/**
 * Deprecated slot interface belonging to the old data model (durations instead of intervals)
 */
export type DeprecatedSlotInterface = Omit<SlotInterface, "intervals"> & {
  durations: string[];
};
