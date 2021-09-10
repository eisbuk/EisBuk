import { DateTime } from "luxon";

import { __storybookDate__ } from "@/lib/constants";

import { CustomerAttendance, MonthAttendance } from "@/types/temp";

import { luxon2ISODate } from "@/utils/date";

// #region testData
/**
 * Date we're using for tests as current date.
 */
export const testDate = __storybookDate__;
/**
 * Month of our test date.
 */
export const monthString = testDate.substring(0, 7);
/**
 * The id of our observed slot (the one we're updating throughout the tests).
 */
export const observedSlotId = "slot-0";
// #endregion testData

// #region additionalData
// next day of our test date
const nextDay = luxon2ISODate(
  DateTime.fromISO(__storybookDate__).plus({ days: 1 })
);
/**
 * Dummy attendance info we're using to provide additional data (not to be overwritten).
 * We're not using these values for our "observed" attendace (the one we'll be updating).
 */
const dummyAttendance = {
  booked: "10:00-10:30",
  attended: "10:00-10:30",
};
// #region additionalData

// #region testDataUtils
/**
 * Interface we're passing to `createDocumentWithObservedAttendance`
 * in order to set only the variable attendance and leave the additional
 * data intact
 */
interface VariableAttendance {
  [customerId: string]: CustomerAttendance;
}

/**
 * Creates a dummy document populated with predetermined data (the data that should not be altered throughout the tests) and
 * adds `variableAttendance` entry (received as arg) into the `[currentMonth].[currentDay].[observedSlot]` in order to test
 * observed customer attendance without altering the surrounding data.
 * @param variableAttendance a record to be added to observed slot representing observed attendance (passed as customerId-attendance object key-value pair)
 */
export const createDocumentWithObservedAttendance = (
  variableAttendance: VariableAttendance
): MonthAttendance => ({
  [testDate]: {
    [observedSlotId]: {
      ["dummy-customer-0"]: dummyAttendance,
      ["dummy-customer-1"]: dummyAttendance,
      ...variableAttendance,
    },
    ["dummy-slot-0"]: {
      ["dummy-customer-0"]: dummyAttendance,
      ["dummy-customer-1"]: dummyAttendance,
    },
  },
  [nextDay]: {
    ["dummy-slot-1"]: {
      ["dummy-customer-0"]: dummyAttendance,
      ["dummy-customer-1"]: dummyAttendance,
    },
  },
});
// #endregion testDataUtils
