import {
  luxon2ISODate,
  getSlotTimespan,
  CustomerAttendance,
  compareCustomerBookings,
} from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

import { AttendanceCardProps } from "@/controllers/AttendanceCard";

import { getSlotsByMonth } from "../slots";
import { getCustomerById } from "../customers";

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

/**
 * Selector that returns for a slot's attendance, only for local use so far but could be useful down the line
 * @param slotId
 * @returns { "customerId": {"bookedInterval": "09:00-10:00",  "attendedInterval": "09:00-10:00"} }
 */
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

/**
 * Selector that returns for a slot a list of booked intervals with customers who booked it
 * @param slotId
 * @returns { "8-9": ["saul goodman", "walter white"], "9-10": ["saul goodman"] }
 */
export const getBookedIntervalsCustomers =
  (slotId: string) =>
  (state: LocalStore): { [interval: string]: string[] } => {
    const slotAttendances = getSlotAttendance(slotId)(state);

    const customersWhoBooked = Object.entries(slotAttendances).reduce(
      (acc, [customerId, { bookedInterval }]) => {
        if (!bookedInterval) return acc;

        const customer = getCustomerById(customerId)(state);

        return {
          ...acc,
          [bookedInterval]: [
            ...(acc[bookedInterval] || []),
            `${customer?.name} ${customer?.surname}`,
          ],
        };
      },
      {}
    );
    return customersWhoBooked;
  };

export {};
