import {
  CustomerAttendance,
  CustomerBookingEntry,
  SlotAttendnace,
} from "@/types/temp";

import { timestampDate } from "@/__testData__/date";

/**
 * Customer id we're using across tests
 */
export const customerId = "test-customer";
/**
 * Slot (booking) id we're using across tests
 */
export const slotId = "slot-0";

// #region attendance

/**
 * Interval we're using to test booking triggering attendance
 */
const bookedInterval = "09:00-11:00";
/**
 * Booking we're marking for our customer in order to test attendance trigger
 */
export const testBooking: CustomerBookingEntry = {
  date: timestampDate,
  interval: bookedInterval,
};
/**
 * Dummy customer with attendance
 */
export const dummyAttendance: Record<string, CustomerAttendance> = {
  ["dummy-customer"]: {
    booked: "11:30-12:30",
    attended: "11:30-12:30",
  },
};
/**
 * Base attendance entry for slot without test user's attendance
 */
export const baseAttendance: SlotAttendnace = {
  date: timestampDate,
  attendances: {
    ...dummyAttendance,
  },
};

export const attendanceWithTestCustomer: SlotAttendnace = {
  date: timestampDate,
  attendances: {
    ...dummyAttendance,
    [customerId]: {
      booked: bookedInterval,
      attended: null,
    },
  },
};

// #endregion attendance
