import { fb2Luxon, fromISO, luxonToFB } from "./dtutils";
import { DateTime } from "luxon";

import { Slot } from "eisbuk-shared";

// ***** Region Shift Slots Day ***** //
interface ShiftSlotsDay {
  <S extends Slot | Slot<"id">>(slots: S[], newDay: string): S[];
}

/**
 * Shifts date for all of the slots (keeping time of the day) to provided new day
 * @param slots array of slots
 * @param newDay ISO date string of the day to switch to
 * @returns array of updated slots
 */
export const shiftSlotsDay: ShiftSlotsDay = (slots, newDay) =>
  slots.map((slot) => {
    const { hour, minute } = fb2Luxon(slot.date).toObject();
    const baseDay = fromISO(newDay).toObject();

    const newDate = DateTime.fromObject({
      ...baseDay,
      hour,
      minute,
    });

    return { ...slot, date: luxonToFB(newDate) };
  });
// ***** End Region Shift Slots Day ***** //

// ***** Region Shift Slots Week ***** //
interface ShiftSlotsWeek {
  <S extends Slot | Slot<"id">>(
    slots: S[],
    oldWeekStart: DateTime,
    newWeekStart: DateTime
  ): S[];
}

/**
 * Shifts date for the whole week of slots to new week (keeping day and time of day intact)
 * @param slots array of slots
 * @param oldWeekStart ISO date string
 * @param newWeekStart ISO date string
 * @returns array of updated slots
 */
export const shiftSlotsWeek: ShiftSlotsWeek = (
  slots,
  oldWeekStart,
  newWeekStart
) => {
  const difference = newWeekStart.diff(oldWeekStart, ["days"]).days;

  if (difference % 7 !== 0) {
    console.error(
      `oldWeekStart and newWeekStart are not a multiple of 7 days apart: ${oldWeekStart.toISO()} → ${newWeekStart.toISO()}`
    );
    return slots;
  }

  return slots.map((slot) => {
    const dt = fb2Luxon(slot.date);
    return { ...slot, date: luxonToFB(dt.plus({ days: difference })) };
  });
};
// ***** End Region Shift Slots Week ***** //
