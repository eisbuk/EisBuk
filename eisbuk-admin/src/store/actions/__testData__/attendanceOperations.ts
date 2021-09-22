import { CustomerAttendance, SlotAttendnace } from "@/types/temp";

import { timestampDate } from "@/__testData__/date";

// #region testData
/**
 * The id of our observed slot (the one we're updating throughout the tests).
 */
export const observedSlotId = "slot-0";
// #endregion testData

// #region additionalData
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
 * Creates a dummy document (slot attendance entry) populated with predetermined data (the data that should not be altered throughout the tests) and
 * adds `variableAttendance` entry (received as arg) into the `attendances` record
 * @param variableAttendance a record to be added to observed slot representing observed attendance (passed as customerId-attendance object key-value pair)
 */
export const createDocumentWithObservedAttendance = (
  variableAttendance: VariableAttendance
): SlotAttendnace => ({
  date: timestampDate,
  attendances: {
    ["dummy-customer-0"]: dummyAttendance,
    ["dummy-customer-1"]: dummyAttendance,
    ...variableAttendance,
  },
});
// #endregion testDataUtils
