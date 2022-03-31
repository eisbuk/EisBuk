import { SlotsById, SlotsByDay, SlotType } from "@eisbuk/shared";

import { CustomerRoute } from "@/enums/routes";

import { SlotsByCustomerRoute } from "@/types/store";

/**
 * Takes in a "raw" input of slots recieved from store and returns an object with
 * slots appropriate for each route.
 * @param slots input of slots retrived from store (SlotsByDay)
 * @returns an object keyed by `CustomerRoute` with values:
 * - `book_ice`: SlotsByDay with only slots of type `"ice"`
 * - `book_off_ice`: SlotsByDay with slots of type `"off_ice_dancing" | "off_ice_gym"`
 * - `calendar`: All slots from input flattened by one level, resulting in `[slotId]: Slot` key-value pairs.
 * Used to match bookings with apropriate slots by `slotId`
 */
export const splitSlotsByCustomerRoute = (
  slots: SlotsByDay
): SlotsByCustomerRoute<SlotsByDay> => {
  // group slots, with respect to type, on day level
  const days = Object.keys(slots);
  const daysMap = days.reduce(
    (acc, dayISO) => ({
      ...acc,
      [dayISO]: Object.values(slots[dayISO]).reduce((acc, slot) => {
        const type =
          slot.type === SlotType.Ice
            ? CustomerRoute.BookIce
            : CustomerRoute.BookOffIce;
        acc[type] = { ...acc[type], [slot.id]: slot };
        return acc;
      }, {} as SlotsByCustomerRoute<SlotsById>),
    }),
    {} as Record<string, SlotsByCustomerRoute<SlotsById>>
  );

  // lift grouping to top (month/week) level
  return {
    [CustomerRoute.BookIce]: days.reduce(
      (acc, dayISO) =>
        daysMap[dayISO][CustomerRoute.BookIce]
          ? {
              ...acc,
              [dayISO]: daysMap[dayISO][CustomerRoute.BookIce],
            }
          : acc,
      {} as SlotsByDay
    ),
    [CustomerRoute.BookOffIce]: days.reduce(
      (acc, dayISO) =>
        daysMap[dayISO][CustomerRoute.BookOffIce]
          ? {
              ...acc,
              [dayISO]: daysMap[dayISO][CustomerRoute.BookOffIce],
            }
          : acc,
      {} as SlotsByDay
    ),
    [CustomerRoute.Calendar]: days.reduce(
      (acc, dayISO) => ({ ...acc, ...slots[dayISO] }),
      {} as SlotsById
    ),
  };
};
