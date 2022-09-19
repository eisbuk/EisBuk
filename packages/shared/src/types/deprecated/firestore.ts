import { Timestamp } from "@google-cloud/firestore";

import { SlotInterface, Customer } from "../firestore";

/**
 * Deprecated entry for bookings meta. Now it's `CustomerBase`
 * as each `bookings` entry actually contains customer's base data.
 */
export type DeprecatedBookingsMeta = Pick<Customer, "name"> &
  Pick<Customer, "surname"> &
  Pick<Customer, "categories"> & {
    // eslint-disable-next-line camelcase
    customer_id: string;
  };

/**
 * Deprecated slot interface belonging to the old data model (durations instead of intervals)
 */
export type DeprecatedSlotInterface = Omit<
  Omit<SlotInterface, "intervals">,
  "date"
> & {
  durations: string[];
  date: Timestamp;
};
