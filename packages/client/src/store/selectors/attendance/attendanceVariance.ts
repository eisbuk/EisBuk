import { SlotAttendnace } from "@eisbuk/shared";

import { LocalStore } from "@/types/store";
import { getMonthStr } from "@/utils/helpers";

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

  const monthAttendanceRecords = Object.values(attendance).filter(
    filterAttendanceByMonth(currentMonth)
  );

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
