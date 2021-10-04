import {
  CustomerAttendance,
  CustomerBookingEntry,
  SlotAttendnace,
  Category,
  CustomerBase,
  SlotInterface,
  SlotType,
} from "eisbuk-shared";

import { timestampDate } from "@/__testData__/date";

/**
 * Customer id we're using across tests
 */
export const customerId = "test-customer";
/**
 * Secret key for customer we're using across tests
 */
// eslint-disable-next-line camelcase
export const secretKey = "test-secret-key";
/**
 * Slot (booking) id we're using across tests
 */
export const slotId = "slot-0";

// #region slots

/**
 * A dummy slot we're using across tests to test data triggers
 * listening to write/update/delete document in slots collection.
 */
export const slot: Omit<SlotInterface, "id"> = {
  date: timestampDate,
  categories: [Category.Course],
  intervals: {
    ["11:30-12:30"]: {
      startTime: "11:30",
      endTime: "12:30",
    },
    ["09:00-11:00"]: {
      startTime: "09:00",
      endTime: "11:00",
    },
  },
  type: SlotType.Ice,
  notes: "",
};

// #endregion slots

// #region bookings

export const customerBooking: CustomerBase = {
  id: customerId,
  name: "Jian",
  surname: "Yang",
  category: Category.Course,
};

// #endregion bookings

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
    bookedInterval: "11:30-12:30",
    attendedInterval: "11:30-12:30",
  },
};
/**
 * Empty attendance entry for slot. Should be created when the slot is created.
 */
export const emptyAttendance: SlotAttendnace = {
  date: timestampDate,
  attendances: {},
};
/**
 * Base attendance entry for slot without test user's attendance
 */
export const baseAttendance: SlotAttendnace = {
  ...emptyAttendance,
  attendances: {
    ...dummyAttendance,
  },
};
/**
 * Attendance entry with customer attendance for our test customer.
 * We're using this to test adding booked attendance when customer books a slot.
 */
export const attendanceWithTestCustomer: SlotAttendnace = {
  date: timestampDate,
  attendances: {
    ...dummyAttendance,
    [customerId]: {
      bookedInterval: bookedInterval,
      attendedInterval: bookedInterval,
    },
  },
};

// #endregion attendance
