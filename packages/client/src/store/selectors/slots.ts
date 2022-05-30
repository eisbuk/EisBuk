/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { DateTime } from "luxon";

import {
  SlotsByDay,
  Category,
  SlotsById,
  luxon2ISODate,
  DeprecatedCategory,
  CategoryUnion,
} from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

// #region localHelpers
interface CategoryFilter {
  (categories: CategoryUnion[]): boolean;
}

/**
 * An util higher order function returning the condition for category filtering
 * based on received category.
 * @param category category (of a customer we're filtering for)
 * @returns a filtering function used check if slot's categories contain the category or should be filtered out
 */
const createCategoryFilter = (category: CategoryUnion): CategoryFilter =>
  // For unspecified "adults" we're showing all the "adult-" prefixed category slots
  category === DeprecatedCategory.Adults
    ? (categories) =>
        categories.includes(DeprecatedCategory.Adults) ||
        categories.includes(Category.CourseAdults) ||
        categories.includes(Category.PreCompetitiveAdults)
    : // For customers belonging to "adult-" prefixed category, we're showing the specific category slots
    // as well as general "adult" slots
    [Category.PreCompetitiveAdults, Category.CourseAdults].includes(
        category as Category
      )
    ? (categories) =>
        categories.includes(DeprecatedCategory.Adults) ||
        categories.includes(category)
    : // For all non adult categories, we're only displaying the slot if it contains that exact category
      (categories) => categories.includes(category);

/**
 * A helper function we're using to filter out slots not within provided category.
 * @param slotsRecord record of slots keyed by slotId
 * @param category customer's category we're checking against
 * @returns a tuple of filtered slots record and boolean (true if filtered record is empty)
 */
const filterSlotsByCategory = (
  slotsRecord: SlotsById,
  category: CategoryUnion
): [SlotsById, boolean] => {
  let isEmptyWhenFiltered = true;

  const categoryFilter = createCategoryFilter(category);

  const filteredRecord = Object.keys(slotsRecord).reduce((acc, slotId) => {
    const slot = slotsRecord[slotId];
    const categories = slot.categories as CategoryUnion[];

    if (categoryFilter(categories)) {
      isEmptyWhenFiltered = false;
      return { ...acc, [slotId]: slot };
    }
    return acc;
  }, {} as SlotsById);

  return [filteredRecord, isEmptyWhenFiltered];
};
// #endregion localHelpers

/**
 * Get `slotsByDay` entry from store, filtered according to `timeframe`, `startDate` and `category`
 * @param category category of customer viewing the slots
 * @param timeframe "week" | "month"
 * @param startDate start of timeframe
 * @returns created selector
 */
export const getSlotsForCustomer =
  (
    category: Category | DeprecatedCategory,
    timeframe: "week" | "month",
    startDate: DateTime
  ) =>
  // eslint-disable-next-line consistent-return
  (state: LocalStore): SlotsByDay => {
    const allSlotsInStore = state.firestore.data?.slotsByDay;

    // return early if no slots in store
    if (!allSlotsInStore) return {};

    switch (timeframe) {
      case "month":
        // get slots for current month
        const monthString = startDate.toISO().substring(0, 7);
        const slotsForAMonth = allSlotsInStore[monthString] || {};

        // filter slots from each day with respect to category
        return Object.keys(slotsForAMonth).reduce((acc, date) => {
          const [filteredSlotsDay, isFilteredDayEmpty] = filterSlotsByCategory(
            slotsForAMonth[date],
            category
          );

          return !isFilteredDayEmpty
            ? { ...acc, [date]: filteredSlotsDay }
            : acc;
        }, {} as SlotsByDay);

      case "week":
        // get all week dates
        const weekDates = Array(7)
          .fill(startDate.startOf("week"))
          .map((startDate, i) => luxon2ISODate(startDate.plus({ days: i })));

        // filter slots within each day with respect to category
        const filteredDays = weekDates.reduce((acc, date) => {
          const monthStaring = date.substring(0, 7);
          const slotsMonth = allSlotsInStore[monthStaring] || {};
          const slotsDay = slotsMonth[date] || {};

          const [newDay] = filterSlotsByCategory(slotsDay, category);
          return { ...acc, [date]: newDay };
        }, {} as SlotsByDay);

        return filteredDays;
    }
  };

/**
 * Get slots for admin view, with respect to current date
 * @param state Local store state
 * @returns record of days filled with slots
 */
export const getAdminSlots = (state: LocalStore): SlotsByDay => {
  const {
    firestore: {
      data: { slotsByDay: allSlotsInStore },
    },
    app: { calendarDay },
  } = state;

  // we're using empty object as a fallback for `slotsByDay`
  // this way the empty object gets trickled down through `undefined` checks/fallbacks below
  // and results in returning of empty days if no `slotsByDay` entry in store
  // it also serves as a slight optimization as the dates are always iterated through only once
  // (as opposed to creating fallback dates and filling them with slots later)
  const slotsByDay = allSlotsInStore ?? {};

  const startCalendarDay = calendarDay.startOf("week");
  // create all dates for a week
  return Array(7)
    .fill(null)
    .reduce((acc, _, i) => {
      const date = startCalendarDay.plus({ days: i });
      const dateISO = luxon2ISODate(date);
      const monthString = dateISO.substr(0, 7);

      const monthSlots = slotsByDay[monthString] || {};

      return {
        ...acc,
        [dateISO]: monthSlots[dateISO] || {},
      };
    }, {} as SlotsByDay);
};
