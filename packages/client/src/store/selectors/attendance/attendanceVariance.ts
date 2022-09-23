import { SlotAttendnace, Customer } from "@eisbuk/shared";

import { LocalStore } from "@/types/store";
import { getMonthStr, calculateIntervalDuration } from "@/utils/helpers";
import { type DayAttendanceHours } from "@eisbuk/ui";

interface AttendanceRecord extends CustomerAttendanceRecord {
  customerId: string;
}

interface CustomerAttendanceMap {
  [customerId: string]: CustomerAttendanceRecord[];
}

interface CustomerAttendanceRecord {
  date: string;
  attendedInterval: number;
  bookedInterval: number;
}

export const getMonthAttendanceVariance = (state: LocalStore) => {
  const {
    app: { calendarDay },
    firestore: {
      data: { attendance = [], customers = {} },
    },
  } = state;

  const currentMonth = getMonthStr(calendarDay, 0);

  const customerAttendance = Object.values(attendance)
    .filter(filterAttendanceByMonth(currentMonth))
    .reduce(flattenAndConvertAttendanceIntervals, [])
    .reduce(collectAttendanceByCustomer, {});

  const attendanceTableData = Object.entries(customerAttendance).map(
    formatToTableData(customers)
  );

  return attendanceTableData;
};

/**
 * Filters an array of SlotAttendance documents
 * by strict equality to date substring `YYYY-MM`
 * @param {string} month as "YYYY-MM"
 */
export const filterAttendanceByMonth =
  (month: string) => (slotAttendance: SlotAttendnace) =>
    slotAttendance.date.substring(0, 7) === month;

/**
 * Flattens nested `SlotAttendance.attendances`
 * and converts attendance interval strings | null to numbers
 * e.g:
 * `customerAttendance.reduce(flattenAndConvertAttendanceIntervals, [])`
 */
export const flattenAndConvertAttendanceIntervals = (
  acc: AttendanceRecord[],
  { attendances, date }: SlotAttendnace
) => {
  const flatAttendanceIntervals = Object.entries(attendances).map(
    ([customerId, { attendedInterval, bookedInterval }]) => ({
      date,
      customerId,
      attendedInterval: calculateIntervalDuration(attendedInterval),
      bookedInterval: calculateIntervalDuration(bookedInterval),
    })
  );
  return [...acc, ...flatAttendanceIntervals];
};

/**
 * Collect attendance records in a map by Customer ID
 *  e.g:
 * `customerAttendance.reduce(collectAttendanceByCustomer, {})`
 */
export const collectAttendanceByCustomer = (
  acc: CustomerAttendanceMap,
  { customerId, ...attendanceRecord }: AttendanceRecord
) => {
  acc[customerId]
    ? acc[customerId].push(attendanceRecord)
    : (acc[customerId] = [attendanceRecord]);

  return acc;
};

/**
 * Formats CustomerAttendance records as AttendanceVariance TableData entries by:
 * - mapping customerId to customer name
 * - reducing daily attendance to a single number
 * e.g:
 * `customerAttendance.map(formatToTableData(customers))`
 */
export const formatToTableData =
  (customers: Record<string, Customer>) =>
  ([customerId, customerRecords]: [
    customerId: string,
    customerRecords: CustomerAttendanceRecord[]
  ]) => {
    const athlete = `${customers[customerId]?.name} ${customers[customerId]?.surname}`;
    const hours = customerRecords.reduce(collectCustomerDailyAttendance, {});

    return { athlete, hours };
  };

/**
 * Reduce multiple customer attendance records for a day to a single number,
 * and collect by date in an object, e.g:
 * `customerAttendance.reduce(collectAttendanceByCustomer, {})`
 */
const collectCustomerDailyAttendance = (
  acc: DayAttendanceHours,
  { date, bookedInterval, attendedInterval }: CustomerAttendanceRecord
) => {
  const dateEntry = acc[date];

  if (dateEntry) {
    const [booked, attended] = dateEntry;
    acc[date] = [booked + bookedInterval, attended + attendedInterval];
  } else {
    acc[date] = [bookedInterval, attendedInterval];
  }

  return acc;
};
