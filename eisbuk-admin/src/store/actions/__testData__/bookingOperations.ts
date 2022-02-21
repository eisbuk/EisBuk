import { CustomerBookings } from "eisbuk-shared";

import { testDate } from "@/__testData__/date";
import { baseSlot } from "@/__testData__/slots";

const intervals = Object.keys(baseSlot.intervals);

const baseBooking = {
  date: testDate,
  interval: intervals[0],
};
/**
 * Initial bookings within customer's `bookedSlots`. Should not be altered during tests
 */
export const bookedSlots: Required<CustomerBookings>["bookedSlots"] = {
  ["slot-0"]: baseBooking,
  ["slot-1"]: baseBooking,
};
/**
 * Id of a test slot we're providing bookings for
 */
export const bookingId = "booked-slot-0";
/**
 * Booking entry we're using to test adding/canceling, etc.
 */
export const testBooking = {
  date: testDate,
  interval: intervals[1],
};
/**
 * Secret key of our test customer
 */
export const secretKey = "secret-key";
