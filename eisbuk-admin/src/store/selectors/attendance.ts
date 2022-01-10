import { luxon2ISODate } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import { AttendanceCardProps } from "@/components/atoms/AttendanceCard";

import { compareCustomers } from "@/utils/customers";

export const getSlotsWithAttendance = (
  state: LocalStore
): Omit<AttendanceCardProps, "allCustomers">[] => {
  const {
    app: { calendarDay },
    firestore: {
      data: { customers: allCustomers, slotsByDay, attendance },
    },
  } = state;

  // exit early if no slots, attendances or customers exist in store
  if (!slotsByDay || !attendance || !allCustomers) return [];

  const dateISO = luxon2ISODate(calendarDay);
  const monthString = dateISO.substring(0, 7);

  const slotsForMonth = slotsByDay[monthString];

  // exit early if no slots month empty
  if (!slotsForMonth) return [];

  const slotsInDay = slotsForMonth[dateISO];

  // exit early if slots day empty
  if (!slotsInDay) return [];

  // ids for all slots in a day
  const slotIds = Object.keys(slotsInDay);

  return slotIds.map((slotId) => {
    const slotsAttendance = attendance[slotId]?.attendances;
    // create customer + attendance-for-customer entries for slot
    const customers: AttendanceCardProps["customers"] = Object.keys(
      slotsAttendance
    )
      .map((customerId) => ({
        ...allCustomers[customerId],
        ...slotsAttendance[customerId],
      }))
      // sort customers alphabetically
      .sort(compareCustomers);

    return { ...slotsInDay[slotId], customers };
  });
};
