import {
  CustomerBookingEntry,
  SlotAttendnace,
  SlotsByDay,
  DateHasBookingsMap,
} from "@eisbuk/shared";

import { LocalStore } from "@/types/store";
import { DateTime } from "luxon";

const getMonthTemplate = (date: DateTime) => {
  const startDate = date.startOf("month");
  const endDate = date.endOf("month");

  return Array(endDate.day - startDate.day).reduce((acc, _, i) => {
    const isoDate = startDate.plus({ days: i }).toISODate();
    return { ...acc, [isoDate]: "empty" };
  }, {});
};

const getCalendarDataFromAttendance = (
  date: string,
  attendance: Record<string, SlotAttendnace>
): DateHasBookingsMap => {
  const calendar = getMonthTemplate(DateTime.fromISO(date));
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
  const calendar = getMonthTemplate(DateTime.fromISO(date));

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

    const luxonDate = DateTime.fromISO(date);
    // if attendance exists, the user is an admin
    // use the most efficient booked state cheking (against attendance)
    if (attendance) {
      return getCalendarDataFromAttendance(date, attendance);
    }

    // return early if slot/booking data not yet loaded
    if (!slotsByMonth || slotsByMonth.length) {
      return getMonthTemplate(luxonDate);
    }

    const monthStr = date.substr(0, 7);
    const slotsByDay = slotsByMonth[monthStr] || {};

    return getCalendarDataFromSlots(date, slotsByDay, bookedSlots);
  };
