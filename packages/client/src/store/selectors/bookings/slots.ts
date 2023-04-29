import {
  Category,
  SlotsById,
  DeprecatedCategory,
  CategoryUnion,
  SlotInterface,
  CustomerBookingEntry,
  SlotsByDay,
  SlotInterval,
} from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

import { getCalendarDay } from "@/store/selectors/app";
import { getBookingsCustomer } from "./customer";

import { getSlotTimespan, isEmpty } from "@/utils/helpers";
import { comparePeriods } from "@/utils/sort";

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
 * Get subscribed slots from state
 * @param state Local Redux Store
 * @returns record of subscribed slots
 */
export const getAttendedSlots = (
  state: LocalStore
): Record<string, Omit<CustomerBookingEntry, "bookingNotes">> =>
  state.firestore.data?.attendedSlots || {};

/**
 * An util higher order function returning the condition for category filtering
 * based on received category.
 * @param category category (of a customer we're filtering for)
 * @returns a filtering function used check if slot's categories contain the category or should be filtered out
 */
const createCategoryFilter = (
  customerCategory: CategoryUnion[]
): CategoryFilter =>
  // For unspecified "adults" we're showing all the "adult-" prefixed category slots
  customerCategory.includes(DeprecatedCategory.Adults)
    ? (categories) =>
        categories.includes(DeprecatedCategory.Adults) ||
        categories.includes(Category.CourseAdults) ||
        categories.includes(Category.PreCompetitiveAdults)
    : // For customers belonging to "adult-" prefixed category, we're showing the specific category slots
    // as well as general "adult" slots
    customerCategory.some((cat) =>
        [Category.PreCompetitiveAdults, Category.CourseAdults].includes(
          cat as Category
        )
      )
    ? (categories) =>
        categories.includes(DeprecatedCategory.Adults) ||
        categories.some((slotCat) => customerCategory.includes(slotCat))
    : // For all non adult categories, we're only displaying the slot if it contains that exact category
      (categories) =>
        categories.some((slotCat) => customerCategory.includes(slotCat));

/**
 * A helper function we're using to filter out slots not within provided category.
 * @param slotsRecord record of slots keyed by slotId
 * @param category customer's category we're checking against
 * @returns a tuple of filtered slots record and boolean (true if filtered record is empty)
 */
const filterSlotsByCategory = (
  slotsRecord: SlotsById,
  category: CategoryUnion[]
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

  // Sort dates so that the final output is sorted
  const daysToRender = Object.keys(slotsMonth).sort((a, b) => (a < b ? -1 : 1));
  if (!daysToRender.length || !customerData) {
    return [];
  }

  return daysToRender.map((date) => ({
    date,
    slots: Object.values(slotsMonth[date])
      .sort(({ intervals: i1 }, { intervals: i2 }) => {
        const ts1 = getSlotTimespan(i1).replace(" ", "");
        const ts2 = getSlotTimespan(i2).replace(" ", "");

        return comparePeriods(ts1, ts2);
      })
      .map((slot) =>
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
  const categories = getBookingsCustomer(state)?.categories;

  // Return early if no category found in store
  if (!categories) {
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
      categories
    );

    // Add date to the acc object only if date not empty
    return !isFilteredDayEmpty ? { ...acc, [date]: filteredSlotsDay } : acc;
  }, {} as SlotsByDay);
};

export const getMonthEmptyForBooking = (state: LocalStore): boolean => {
  return isEmpty(getSlotsForCustomer(state));
};

type BookingsList = Array<SlotInterface & { interval: SlotInterval }>;
type BookedAndAttendedList = Array<
  SlotInterface & { interval: SlotInterval } & { booked: boolean }
>;

export const getBookingsForCalendar = (
  state: LocalStore
): (SlotInterface & { interval: SlotInterval })[] => {
  // Current month in view is determined by `currentDate` in Redux store
  const monthString = getCalendarDay(state).toISO().substring(0, 7);
  // Get all booked slots
  const bookedSlots = getBookedSlots(state);
  // Get only the slots for current month
  const slotsByMonth = state.firestore.data.slotsByDay || {};
  const slotsForAMonth = slotsByMonth[monthString] || {};

  return Object.entries(bookedSlots)
    .reduce(
      (acc, [slotId, { date, interval: bookedInterval, bookingNotes }]) => {
        // If this returns undefined, our slot isn't in date range
        const dayOfBookedSlot = slotsForAMonth[date];
        if (!dayOfBookedSlot) {
          return acc;
        }
        const bookedSlot = dayOfBookedSlot[slotId];
        const interval = bookedSlot.intervals[bookedInterval];
        const completeBookingEntry = { ...bookedSlot, interval, bookingNotes };
        return [...acc, completeBookingEntry];
      },
      [] as BookingsList
    )
    .sort((a, b) => (a.date < b.date ? -1 : 1));
};

export const getHasBookingsForCalendar = (state: LocalStore): boolean =>
  Boolean(getBookingsForCalendar(state).length);

export const getBookedAndAttendedSlotsForCalendar = (
  state: LocalStore
): (SlotInterface & { interval: SlotInterval } & { booked: boolean })[] => {
  // Current month in view is determined by `currentDate` in Redux store
  const monthString = getCalendarDay(state).toISO().substring(0, 7);

  // Get all booked slots
  const bookedSlots = getBookedSlots(state);
  const attendedSlots = getAttendedSlots(state);
  // Get only the slots for current month
  const slotsByMonth = state.firestore.data.slotsByDay || {};
  const slotsForAMonth = slotsByMonth[monthString] || {};

  const attendedSlotsObj = Object.entries(attendedSlots).reduce(
    (acc, [slotId, { date, interval: attendedInterval }]) => {
      // If this returns undefined, our slot isn't in date range
      const dayOfAttendedSlot = slotsForAMonth[date];
      if (!dayOfAttendedSlot) {
        return acc;
      }

      const attendedSlot = dayOfAttendedSlot[slotId];
      const interval = attendedSlot.intervals[attendedInterval];
      const completeAttendanceEntry = {
        ...attendedSlot,
        interval,
        booked: false,
      };
      return [...acc, completeAttendanceEntry];
    },
    [] as BookedAndAttendedList
  );
  const bookedSlotsObj = Object.entries(bookedSlots).reduce(
    (acc, [slotId, { date, interval: bookedInterval, bookingNotes }]) => {
      // If this returns undefined, our slot isn't in date range
      const dayOfBookedSlot = slotsForAMonth[date];
      if (!dayOfBookedSlot) {
        return acc;
      }

      const bookedSlot = dayOfBookedSlot[slotId];
      const interval = bookedSlot.intervals[bookedInterval];
      const completeBookingEntry = {
        ...bookedSlot,
        interval,
        bookingNotes,
        booked: true,
      };
      return [...acc, completeBookingEntry];
    },
    [] as BookedAndAttendedList
  );
  return [...attendedSlotsObj, ...bookedSlotsObj].sort((a, b) =>
    a.date < b.date ? -1 : 1
  );
};
