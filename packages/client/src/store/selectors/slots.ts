import { SlotsByDay, luxon2ISODate } from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

const sortSlotCategories = (
  slotsByMonth: Record<string, SlotsByDay>
): Record<string, SlotsByDay> =>
  Object.fromEntries(
    Object.entries(slotsByMonth).map(([month, slotsByDay]) => [
      month,
      Object.fromEntries(
        Object.entries(slotsByDay).map(([day, slots]) => [
          day,
          Object.fromEntries(
            Object.entries(slots).map(([slotId, slot]) => [
              slotId,
              {
                ...slot,
                categories: slot.categories.sort((a, b) => (a < b ? -1 : 1)),
              },
            ])
          ),
        ])
      ),
    ])
  );

export const getSlotsByMonth = (
  state: LocalStore
): LocalStore["firestore"]["data"]["slotsByDay"] =>
  sortSlotCategories(state.firestore.data.slotsByDay ?? {});

/**
 * Get slots for admin view, with respect to current date
 * @param state Local store state
 * @returns record of days filled with slots
 */
export const getAdminSlots = (state: LocalStore): SlotsByDay => {
  const allSlotsInStore = getSlotsByMonth(state);
  const {
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
