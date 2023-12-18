import {
  SlotInterface,
  CustomerBookingEntry,
  SlotsByDay,
  SlotInterval,
  getSlotTimespan,
  valueMapper,
  wrapIter,
} from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

import { getCalendarDay } from "@/store/selectors/app";
import { getBookingsCustomer } from "./customer";

import { isEmpty } from "@/utils/helpers";
import { comparePeriods } from "@/utils/sort";

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
 * Both the `category` and `date` are read directly from store. Slots booked at full capacity are filtered out.
 */
export const getSlotsForCustomer = (state: LocalStore): SlotsByDay => {
  const date = getCalendarDay(state);
  const categories = getBookingsCustomer(state)?.categories;

  // Return early if no category found in store
  if (!categories) {
    return {};
  }

  const allSlotsInStore = state.firestore.data?.slotsByDay;
  const bookingsCounts = state.firestore.data?.slotBookingsCounts || {};

  // Return early if no slots in store
  if (!allSlotsInStore) return {};

  // Get slots for current month
  const monthString = date.startOf("month").toISO().substring(0, 7);
  const slotsForAMonth = allSlotsInStore[monthString] || {};
  const bookingCountsForAMonth = bookingsCounts[monthString] || {};

  // Filter slots from each day with respect to category
  //
  // Start: Iterable of [date, SlotsById (record of slots keyed by slotId)] tuples
  const processedSlots = wrapIter(Object.entries(slotsForAMonth))
    // Map: [date, SlotsById] -> [date, [slotId, SlotInterface][]]
    .map(valueMapper((slots) => Object.entries(slots)))
    // FlatMap: [date, [slotId, SlotInterface][]] -> [date, slotId, SlotInterface]
    .flatMap(([date, slots]) =>
      slots.map(([id, slot]) => [date, id, slot] as const)
    )
    // Filter out slots not matching customer's category
    .filter(([, , slot]) => categories.some((c) => slot.categories.includes(c)))
    // Filter out slots booked at full capacity (or without any capacity set)
    .filter(
      ([, slotId, slot]) =>
        // If booking count is not available, this is a no-op:
        // - this makes it safe for tests (no need for additional setup)
        // - with current production requirements, this is right - we filter the slots only if the capacity is set
        //  and the booking count is availabe (if not, the slot is not yet booked)
        !bookingCountsForAMonth[slotId] ||
        !slot.capacity ||
        slot.capacity > bookingCountsForAMonth[slotId]
    )
    // GroupEntries by date: [date, [slotId, SlotInterface][]]
    ._group(
      ([date, id, slot]) =>
        [date, [id, slot]] as [string, [string, SlotInterface]]
    )
    // Map the value: [date, [slotId, SlotInterface][]] -> [date, SlotsById]
    .map(valueMapper((slots) => Object.fromEntries(slots)));

  return Object.fromEntries(processedSlots);
};

export const getMonthEmptyForBooking = (state: LocalStore): boolean => {
  return isEmpty(getSlotsForCustomer(state));
};

type BookingsEntry = SlotInterface & {
  interval: SlotInterval;
  booked: true;
};
type BookingsList = Array<BookingsEntry>;

export const getBookingsForCalendar = (state: LocalStore): BookingsList => {
  // Current month in view is determined by `currentDate` in Redux store
  const monthString = getCalendarDay(state).toISO().substring(0, 7);
  // Get all booked slots
  const bookedSlots = getBookedSlots(state);
  // Get only the slots for current month
  const slotsByMonth = state.firestore.data.slotsByDay || {};
  const slotsForAMonth = slotsByMonth[monthString] || {};

  return Object.entries(bookedSlots)
    .filter(([, { date }]) => Boolean(slotsForAMonth[date]))
    .reduce(
      (acc, [slotId, { date, interval: bookedInterval, bookingNotes }]) => {
        // If this returns undefined, our slot isn't in date range
        const bookedSlot = slotsForAMonth[date][slotId];
        const interval = bookedSlot.intervals[bookedInterval];
        return [
          ...acc,
          {
            ...bookedSlot,
            interval,
            bookingNotes,
            booked: true,
          } as BookingsEntry,
        ];
      },
      [] as BookingsList
    )
    .sort((a, b) => (a.date < b.date ? -1 : 1));
};

export const getHasBookingsForCalendar = (state: LocalStore): boolean =>
  Boolean(getBookingsForCalendar(state).length);

type CalendarSlotEntry = SlotInterface & {
  interval: SlotInterval;
  booked: boolean;
};
type CalendarSlotList = CalendarSlotEntry[];

export const getBookedAndAttendedSlotsForCalendar = (
  state: LocalStore
): CalendarSlotList => {
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
    [] as CalendarSlotList
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
    [] as CalendarSlotList
  );
  return [...attendedSlotsObj, ...bookedSlotsObj].sort(compareCalendarSlots);
};

const compareCalendarSlots = (a: CalendarSlotEntry, b: CalendarSlotEntry) =>
  a.date < b.date
    ? -1
    : a.date > b.date
    ? 1
    : a.interval.startTime < b.interval.startTime
    ? -1
    : 1;
