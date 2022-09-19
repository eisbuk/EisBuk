import { LocalStore } from "@/types/store";

export const getMonthAttendanceVariance = (state: LocalStore) => {
  const {
    app: { calendarDay },
    firestore: {
      data: { attendance = [], customers = {} },
    },
  } = state;

  return [calendarDay, attendance, customers];
};
