import { Slot, SlotType } from "eisbuk-shared";

import { CustomerRoute } from "@/enums/routes";

interface SlotsById {
  [slotId: string]: Slot<"id">;
}

interface SlotsByDay {
  [dayISO: string]: SlotsById;
}

interface SlotsByType<S extends SlotsById | SlotsByDay> {
  [CustomerRoute.BookIce]: S;
  [CustomerRoute.BookOffIce]: S;
}

/**
 * Groups slots by customer route ``
 * @param slots
 * @returns
 */
export const groupByCustomerRoute = (
  slots: SlotsByDay
): SlotsByType<SlotsByDay> => {
  // map slots within day with respect to type
  const days = Object.keys(slots);
  const daysMap = days.reduce(
    (acc, dayISO) => ({
      ...acc,
      // group slots by type within each day
      [dayISO]: Object.values(slots[dayISO]).reduce((acc, slot) => {
        const type =
          slot.type === SlotType.Ice
            ? CustomerRoute.BookIce
            : CustomerRoute.BookOffIce;
        acc[type] = { ...acc[type], [slot.id]: slot };
        return acc;
      }, {} as SlotsByType<SlotsById>),
    }),
    {} as Record<string, SlotsByType<SlotsById>>
  );

  return {
    // extract each day's `book_ice` slots and save them keyed by proper date
    [CustomerRoute.BookIce]: days.reduce(
      (acc, dayISO) => ({
        ...acc,
        [dayISO]: daysMap[dayISO][CustomerRoute.BookIce],
      }),
      {} as SlotsByDay
    ),
    // extract each day's `book_off_ice` slots and save them keyed by proper date
    [CustomerRoute.BookOffIce]: days.reduce(
      (acc, dayISO) => ({
        ...acc,
        [dayISO]: daysMap[dayISO][CustomerRoute.BookOffIce],
      }),
      {} as SlotsByDay
    ),
  };
};
