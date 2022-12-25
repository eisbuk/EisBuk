import { Timestamp } from "@google-cloud/firestore";

import { SlotInterface } from "../firestore";

/**
 * Deprecated entry for bookings meta. Now it's `CustomerBase`
 * as each `bookings` entry actually contains customer's base data.
 */
export interface DeprecatedBookingsMeta {
  name: string;
  surname: string;
  categories: string[];
  // eslint-disable-next-line camelcase
  customer_id: string;
}

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
