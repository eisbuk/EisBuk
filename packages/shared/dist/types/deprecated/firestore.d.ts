import { Timestamp } from "@google-cloud/firestore";
import { SlotInterface, Customer } from "../firestore";
/**
 * Deprecated entry for bookings meta. Now it's `CustomerBase`
 * as each `bookings` entry actually contains customer's base data.
 */
export declare type DeprecatedBookingsMeta = Pick<Customer, "name"> & Pick<Customer, "surname"> & Pick<Customer, "category"> & {
    customer_id: string;
};
/**
 * Deprecated slot interface belonging to the old data model (durations instead of intervals)
 */
export declare type DeprecatedSlotInterface = Omit<Omit<SlotInterface, "intervals">, "date"> & {
    durations: string[];
    date: Timestamp;
};
