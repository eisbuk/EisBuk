import {
  luxon2ISODate,
  getSlotTimespan,
  CustomerAttendance,
} from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

import { AttendanceCardProps } from "@/controllers/AttendanceCard";

import { compareCustomerBookings } from "@/utils/sort";
import { getSlotsByMonth } from "../slots";

/**
 * Attendance card selector returns slots with customer attendance, used to create attendance cards.
 * The slector is a higher order function accepting and (optional) `sortCustomers` function, to be used
 * as a compare function to sort customers inside the card. If ommited, doesn't sort.
 * @param sortCustomers
 * @returns
 */
export const getSlotsWithAttendance = (
  state: LocalStore
): Omit<AttendanceCardProps, "allCustomers">[] => {
  const slotsByDay = getSlotsByMonth(state);
  const {
    app: { calendarDay },
    firestore: {
      data: { customers: allCustomers, attendance },
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

  // get ids for all slots in a day sorted by slot's time
  const joinIdTimestring = Object.keys(slotsInDay).map((id) => ({
    id,
    timestring: getSlotTimespan(slotsInDay[id].intervals),
  }));
  const slotIds = joinIdTimestring
    .sort((a, b) => (a.timestring > b.timestring ? 1 : -1))
    .map(({ id }) => id);

  return slotIds.map((slotId) => {
    const slotsAttendance = attendance[slotId]?.attendances;
    const customers: AttendanceCardProps["customers"] = Object.keys(
      slotsAttendance
    )
      .map((customerId) => ({
        ...allCustomers[customerId],
        ...slotsAttendance[customerId],
      }))
      .sort(compareCustomerBookings);

    return { ...slotsInDay[slotId], customers };
  });
};

export const getSlotAttendance =
  (slotId: string) =>
  (state: LocalStore): Record<string, CustomerAttendance> => {
    const {
      firestore: {
        data: { attendance },
      },
    } = state;

    return attendance && attendance[slotId]
      ? attendance[slotId].attendances
      : {};
  };
export {};
