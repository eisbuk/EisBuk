import { CustomerBookings } from "eisbuk-shared";

import { testDate } from "@/__testData__/date";

const baseBooking = {
  date: testDate,
  interval: "09:00-10:00",
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
  interval: "09:00-11:00",
};
/**
 * Secret key of our test customer
 */
export const secretKey = "secret-key";
