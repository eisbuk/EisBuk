/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import _ from "lodash";
import { DateTime } from "luxon";

import {
  SlotInterface,
  SlotType,
  SlotsByDay,
  Category,
  SlotsById,
} from "eisbuk-shared";

import { CustomerRoute } from "@/enums/routes";

import { LocalStore } from "@/types/store";

import { flatten } from "@/utils/helpers";

// import { getCustomersRecord } from "./firestore";

import { luxon2ISODate } from "@/utils/date";

// const extractSlotDate = (slot: SlotInterface): number => slot.date.seconds;
// const extractSlotId = (slot: SlotInterface): SlotInterface["id"] => slot.id;

/**
 * Try to execute the passed function.
 * If it fails or it returns default value or empty object,
 * @param fn function to execute
 * @param defaultVal default value (optional)
 * @returns first one sucessful out of: fn(), defaultVal, {}
 */
const getSafe = <F extends () => any>(
  fn: F,
  defaultVal?: ReturnType<F>
): NonNullable<ReturnType<F>> | Record<string, any> => {
  // if no default val provided, fall back to empty object
  const def = defaultVal || {};

  // try and execute the function
  try {
    const result = fn();
    // if result undefined or null, return default value (or fallback)
    return [null, undefined].includes(result) ? def : result;
  } catch {
    // if error, return default value or fallback
    return def;
  }
};

/**
 * Get all slots in a single record, keyed by (day) date
 * @param state Local Redux Store
 * @returns record of all slots, keyed by day, grouped together (regardless of month)
 */
export const getAllSlotsByDay = (
  state: LocalStore
): Record<string, Record<string, SlotInterface>> =>
  flatten(
    Object.values(
      state.firestore.data?.slotsByDay || ({} as Record<string, any>)
    )
  );

/**
 * HOF that creates a selector for view-specific slots by view in a single record, keyed by (day) date
 * @param view tab viewed by customer (ice, off-ice)
 * @returns record of view-specific ice slots, keyed by day, grouped together (regardless of month)
 */
export const getSlotsByView = (view: CustomerRoute) => (state: LocalStore) => {
  const allSlots = flatten(
    Object.values(getSafe(() => state.firestore.data?.slotsByDay))
  );

  if (view === CustomerRoute.Calendar) return allSlots;
  return _.mapValues(allSlots, (daySlots) =>
    _.pickBy(daySlots, (slot) => {
      return view === CustomerRoute.BookIce
        ? slot.type === SlotType.Ice
        : slot.type !== SlotType.Ice;
    })
  );
};

// #region newSelectors
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
// #endregion newSelectors

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
      data: { slotsByDay: allSlotsInStore },
    },
    app: { calendarDay },
  } = state;

  // exit early if if store empty
  if (!allSlotsInStore) return {};

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
