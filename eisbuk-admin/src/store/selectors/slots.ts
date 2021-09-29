/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { DateTime } from "luxon";

import { SlotsByDay, Category, SlotsById } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import { luxon2ISODate } from "@/utils/date";

/**
 * Get `slotsByDay` entry from store, filtered according to `timeframe`, `startDate` and `category`
 * @param category category of customer viewing the slots
 * @param timeframe "week" | "month"
 * @param startDate start of timeframe
 * @returns created selector
 */
export const getSlotsForCustomer = (
  category: Category,
  timeframe: "week" | "month",
  startDate: DateTime
  // eslint-disable-next-line consistent-return
) => (state: LocalStore): SlotsByDay => {
  const allSlotsInStore = state.firestore.data?.slotsByDay;

  // return early if no slots in store
  if (!allSlotsInStore) return {};

  switch (timeframe) {
    case "month":
      // get slots for current month
      const monthString = startDate.toISO().substr(0, 7);
      const slotsForAMonth = allSlotsInStore[monthString] || {};

      // filter slots from each day with respect to category
      return Object.keys(slotsForAMonth).reduce((acc, date) => {
        const [filteredSlotsDay, isFilteredDayEmpty] = filterSlotsByCategory(
          slotsForAMonth[date],
          category
        );

        return !isFilteredDayEmpty ? { ...acc, [date]: filteredSlotsDay } : acc;
      }, {} as SlotsByDay);

    case "week":
      // get all week dates
      const weekDates = Array(7)
        .fill(startDate)
        .map((startDate, i) => luxon2ISODate(startDate.plus({ days: i })));

      // filter slots within each day with respect to category
      const filteredDays = weekDates.reduce((acc, date) => {
        const monthStaring = date.substr(0, 7);
        const slotsMonth = allSlotsInStore[monthStaring] || {};
        const slotsDay = slotsMonth[date] || {};

        const slotKeys = Object.keys(slotsDay);
        const newDay = slotKeys.reduce((acc, slotId) => {
          const { categories } = slotsDay[slotId];
          return categories.includes(category)
            ? { ...acc, [slotId]: slotsDay[slotId] }
            : acc;
        }, {} as SlotsById);
        return { ...acc, [date]: newDay };
      }, {} as SlotsByDay);

      return filteredDays;
  }
};

/**
 * A helper function we're using to filter out slots not within provided category.
 * @param slotsRecord record of slots keyed by slotId
 * @param category customer's category we're checking against
 * @returns a tuple of filtered slots record and boolean (true if filtered record is empty)
 */
const filterSlotsByCategory = (
  slotsRecord: SlotsById,
  category: Category
): [SlotsById, boolean] => {
  let isEmptyWhenFiltered = true;

  const filteredRecord = Object.keys(slotsRecord).reduce((acc, slotId) => {
    const slot = slotsRecord[slotId];
    if (slot.categories.includes(category)) {
      isEmptyWhenFiltered = false;
      return { ...acc, [slotId]: slot };
    }
    return acc;
  }, {} as SlotsById);

  return [filteredRecord, isEmptyWhenFiltered];
};

export const getAdminSlots = (state: LocalStore): SlotsByDay => {
  const {
    firestore: {
      // we're using empty object as a fallback for `slotsByDay`
      // this way the empty object gets trickled down through `undefined` checks/fallbacks below
      // and results in returning of empty days if no `slotsByDay` entry in store
      // it also serves as a slight optimization as the dates are always iterated through only once
      // (as opposed to creating fallback dates and filling them with slots later)
      data: { slotsByDay: allSlotsInStore = {} },
    },
    app: { calendarDay },
  } = state;

  // create all dates for a week
  return Array(7)
    .fill(null)
    .reduce((acc, _, i) => {
      const date = calendarDay.plus({ days: i });
      const dateISO = luxon2ISODate(date);
      const monthString = dateISO.substr(0, 7);

      const monthSlots = allSlotsInStore[monthString] || {};

      return {
        ...acc,
        [dateISO]: monthSlots[dateISO] || {},
      };
    }, {} as SlotsByDay);
};
