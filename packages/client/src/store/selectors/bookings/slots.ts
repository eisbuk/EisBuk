import { DateTime } from "luxon";

import {
  Category,
  SlotsById,
  DeprecatedCategory,
  CategoryUnion,
  SlotInterface,
  CustomerBookingEntry,
  SlotsByDay,
} from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

import { getCalendarDay } from "@/store/selectors/app";
import { getBookingsCustomer } from "./customer";

interface CategoryFilter {
  (categories: CategoryUnion[]): boolean;
}

/**
 * Get subscribed slots from state
 * @param state Local Redux Store
 * @returns record of subscribed slots
 */
export const getBookedSlots = (
  state: LocalStore
): Record<string, CustomerBookingEntry> =>
  state.firestore.data?.bookedSlots || {};

/**
 * Get subscribed slots from state for a specific month
 * @param state Local Redux Store
 * @returns record of subscribed slots
 */
export const getBookedSlotsByMonth =
  (month: number) =>
  (state: LocalStore): Record<string, CustomerBookingEntry> =>
    Object.entries(state.firestore.data?.bookedSlots || {}).reduce(
      (acc, [slotId, CustomerBookingEntry]) =>
        DateTime.fromISO(CustomerBookingEntry.date).month === month
          ? { ...acc, [slotId]: CustomerBookingEntry }
          : acc,
      {}
    );

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

type SlotsForBooking = {
  date: string;
  slots: (SlotInterface & { interval?: string })[];
}[];

export const getSlotsForBooking = (state: LocalStore): SlotsForBooking => {
  const slotsMonth = getSlotsForCustomer(state);
  const bookedSlots = getBookedSlots(state);
  const customerData = getBookingsCustomer(state);

  const daysToRender = Object.keys(slotsMonth);
  if (!daysToRender.length || !customerData) {
    return [];
  }

  return daysToRender.map((date) => ({
    date,
    slots: Object.values(slotsMonth[date]).map((slot) =>
      // If slot booked add interval to the return structure
      bookedSlots[slot.id]
        ? { ...slot, interval: bookedSlots[slot.id].interval }
        : slot
    ),
  }));
};

/**
 * Get `slotsByDay` entry, from store, for current month filtered according to customer's category.
 * Both the `category` and `date` are read directly from store.
 */
export const getSlotsForCustomer = (state: LocalStore): SlotsByDay => {
  const date = getCalendarDay(state);
  const category = getBookingsCustomer(state)?.category;

  // Return early if no category found in store
  // this should never happen and is an internal app error
  if (!category) {
    console.error(
      "No category found in store, check store entries for bookings customer"
    );
    return {};
  }

  const allSlotsInStore = state.firestore.data?.slotsByDay;

  // Return early if no slots in store
  if (!allSlotsInStore) return {};

  // Get slots for current month
  const monthString = date.startOf("month").toISO().substring(0, 7);
  const slotsForAMonth = allSlotsInStore[monthString] || {};

  // Filter slots from each day with respect to category
  return Object.keys(slotsForAMonth).reduce((acc, date) => {
    const [filteredSlotsDay, isFilteredDayEmpty] = filterSlotsByCategory(
      slotsForAMonth[date],
      category
    );

    // Add date to the acc object only if date not empty
    return !isFilteredDayEmpty ? { ...acc, [date]: filteredSlotsDay } : acc;
  }, {} as SlotsByDay);
};
