import {
  CustomerBookingEntry,
  SlotAttendnace,
  SlotsByDay,
} from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

/**
 * Structure for using in calendar picker
 * key is the date in ISO and value is whether this is booked, empty or hasSlots
 */
export interface DateHasBookingsMap {
  [dayInISO: string]: "booked" | "hasSlots";
}

const getCalendarDataFromAttendance = (
  date: string,
  attendance: Record<string, SlotAttendnace>
): DateHasBookingsMap => {
  const calendar = {} as DateHasBookingsMap;
  Object.values(attendance).forEach((slotAttendance) => {
    const { date, attendances } = slotAttendance;

    if (calendar[date] !== "booked") {
      const isBooked = Boolean(
        Object.values(attendances).find(({ bookedInterval }) =>
          Boolean(bookedInterval)
        )
      );
      calendar[date] = isBooked ? "booked" : "hasSlots";
    }
  });
  return calendar;
};

interface BookedSlots {
  [slotId: string]: CustomerBookingEntry;
}
const getCalendarDataFromSlots = (
  date: string,
  slotsByDay: SlotsByDay,
  bookedSlots: BookedSlots
): DateHasBookingsMap => {
  const calendar = {} as DateHasBookingsMap;

  Object.keys(slotsByDay).forEach((dayStr) => {
    if (calendar[dayStr] !== "booked") {
      const slotsInADay = Object.keys(slotsByDay[dayStr]);

      const isBooked = slotsInADay.find((id) => Boolean(bookedSlots[id]));

      calendar[dayStr] = isBooked ? "booked" : "hasSlots";
    }
  });
  return calendar;
};

export const getCalendarData =
  (date: string) =>
  (state: LocalStore): DateHasBookingsMap => {
    const {
      firestore: {
        data: { attendance, bookedSlots = {}, slotsByDay: slotsByMonth },
      },
    } = state;

    // if attendance exists, the user is an admin
    // use the most efficient booked state cheking (against attendance)
    if (attendance) {
      return getCalendarDataFromAttendance(date, attendance);
    }

    // return early if slot/booking data not yet loaded
    if (!slotsByMonth || slotsByMonth.length) {
      return {} as DateHasBookingsMap;
    }

    const monthStr = date.substring(0, 7);
    const slotsByDay = slotsByMonth[monthStr] || {};

    return getCalendarDataFromSlots(date, slotsByDay, bookedSlots);
  };
