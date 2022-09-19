import { SlotAttendnace } from "@eisbuk/shared";

import { LocalStore } from "@/types/store";
import { getMonthStr, convertIntervalToNum } from "@/utils/helpers";

interface AttendanceRecord {
  date: string;
  customerId: string;
  attendedInterval: number;
  bookedInterval: number;
}

interface CustomerAttendance {
  [customerId: string]: Omit<AttendanceRecord, "customerId">[];
}

export const getMonthAttendanceVariance = (state: LocalStore) => {
  const {
    app: { calendarDay },
    firestore: {
      data: {
        attendance = [],
        // customers = {}
      },
    },
  } = state;

  const currentMonth = getMonthStr(calendarDay, 0);

  const monthAttendanceRecords = Object.values(attendance)
    .filter(filterAttendanceByMonth(currentMonth))
    .reduce(flattenAndConvertAttendanceIntervals, [])
    .reduce(collectAttendanceByCustomer, {});

  return monthAttendanceRecords;
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
 * and converts attendance interval strings | null to numbners
 */
export const flattenAndConvertAttendanceIntervals = (
  acc: AttendanceRecord[],
  { attendances, date }: SlotAttendnace
) => {
  const flatAttendanceIntervals = Object.entries(attendances).map(
    ([customerId, { attendedInterval, bookedInterval }]) => ({
      date,
      customerId,
      attendedInterval: convertIntervalToNum(attendedInterval),
      bookedInterval: convertIntervalToNum(bookedInterval),
    })
  );
  return [...acc, ...flatAttendanceIntervals];
};

/**
 * Collect attendance records in a map by Customer ID
 */
const collectAttendanceByCustomer = (
  acc: CustomerAttendance,
  { customerId, ...attendanceRecord }: AttendanceRecord
) => {
  acc[customerId]
    ? acc[customerId].push(attendanceRecord)
    : (acc[customerId] = [attendanceRecord]);

  return acc;
};
