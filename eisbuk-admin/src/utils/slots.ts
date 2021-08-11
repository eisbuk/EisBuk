import { fb2Luxon, fromISO, luxonToFB } from "./date";
import { DateTime } from "luxon";

import { Slot } from "eisbuk-shared";
import { mode } from "./helpers";
import { CustomerRoute } from "@/enums/routes";

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
  <S extends Slot | Slot<"id">>(slots: S[], newWeekStart: DateTime): S[];
}

/**
 * Shifts date for the whole week of slots to new week (keeping day and time of day intact)
 * @param slots array of slots
 * @param newWeekStart ISO date string
 * @returns array of updated slots
 */
export const shiftSlotsWeek: ShiftSlotsWeek = (slots, newWeekStart) => {
  // get the old week start from the majority of slots belonging to it
  // we're using majority as fault tolerence to filter out faulty slots without throwing an error
  const slotWeekStartsISO = slots.map((slot) =>
    fb2Luxon(slot.date).startOf("week").toISO()
  );
  // get mode of slot week start dates
  const slotWeekStartsMode = mode(slotWeekStartsISO);

  // if slots are equally distributed across two different weeks
  // there is no way to employ fault tolerence and the function call is definitely faulty
  if (slotWeekStartsMode === null) {
    throw new Error(
      "There is an equal number of slots belonging to two separate weeks"
    );
  }

  const oldWeekStart = DateTime.fromISO(slotWeekStartsMode);

  // filter slots not belonging o the same week as the rest
  const faultySlots: typeof slots = [] as typeof slots;
  const filteredSlots = slots.filter((slot) => {
    const slotWeekstart = fb2Luxon(slot.date).startOf("week");

    // check if slot belongs to same week as the rest
    const isFaulty = Boolean(oldWeekStart.diff(slotWeekstart, ["days"]).days);

    // if slot is faulty (doesn't belong to same week)
    // add to faulty slots for reporting
    if (isFaulty) {
      faultySlots.push(slot);
      return false;
    }

    return true;
  });

  // report faulty slots, if any (but don't throw)
  if (faultySlots.length) {
    console.log(
      "Some slots don't belong to the same week and have been filtered out"
    );
    console.log("Faulty slots: ", faultySlots);
  }

  // if provided 'newWeekStart' is not a valid start of the week,
  // fall back to start of the same week the provided 'newWeekStart' belongs to
  const safeNewWeekStart = newWeekStart.startOf("week");

  // apply difference to all of the slots and return
  const difference = safeNewWeekStart.diff(oldWeekStart, ["days"]).days;
  return filteredSlots.map((slot) => {
    const oldDate = fb2Luxon(slot.date);

    return { ...slot, date: luxonToFB(oldDate.plus({ days: difference })) };
  });
};
// ***** End Region Shift Slots Week ***** //

/**
 * Generates dates to display based on the view:
 * - 7 days of the week in case of ice
 * - 4-5 Mondays, Tuesdays, etc. of the month in case of off-ice
 * @param currentDate start date for current view
 * @param view passed from props: "book_ice", "book_off_ice" or "ice"
 * @returns array of dates to display
 */
export const getDatesToDisplay = (
  currentDate: DateTime,
  view?: CustomerRoute
) =>
  view === CustomerRoute.BookIce
    ? Array(5)
        .fill(null)
        .map((_, i) => currentDate.plus({ week: i }).toISODate())
        .filter((date) => DateTime.fromISO(date).hasSame(currentDate, "month"))
    : Array(7)
        .fill(null)
        .map((_, i) => currentDate.plus({ days: i }).toISODate());
