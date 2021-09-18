import { DateTime } from "luxon";

import { Slot, Duration, SlotType, Category } from "eisbuk-shared";

import { __storybookDate__ } from "@/lib/constants";

import { fb2Luxon, luxon2ISODate, luxonToFB } from "@/utils/date";
import { SlotInterval } from "@/types/temp";

// #region slot
export const dummySlot: Slot<"id"> & { interval: SlotInterval } = {
  date: luxonToFB(DateTime.fromISO(__storybookDate__!).plus({ hours: 8 })),
  interval: {
    startTime: "08:00",
    endTime: "09:00",
  },
  id: "id",
  durations: [Duration["1h"], Duration["1.5h"], Duration["2h"]],
  type: SlotType.Ice,
  categories: [Category.PreCompetitive],
  notes: "",
};
export const nonBookedSlot: Slot<"id"> & { interval: SlotInterval } = {
  date: luxonToFB(DateTime.fromISO(__storybookDate__!).plus({ hours: 8 })),
  interval: {
    startTime: "09:00",
    endTime: "10:00",
  },
  id: "id",
  durations: [Duration["1h"], Duration["1.5h"], Duration["2h"]],
  type: SlotType.Ice,
  categories: [Category.PreCompetitive],
  notes: "",
};
export const tempSlot = {
  ...dummySlot,
  bookedDuration: Duration["1.5h"],
};

export const collectionOfSlots = Array(4)
  .fill(null)
  .map((_, i) => {
    const defaultDate = fb2Luxon(dummySlot.date);
    const newDate = defaultDate.plus({ hours: i * 2 });
    const date = luxonToFB(newDate);
    return { ...dummySlot, date, id: `slot-${i}` };
  });

/**
 * Dummy month of slots (resembling a structure we should receive from store).
 * Used for `CustomerRoute="book_ice"`
 */
export const slotsMonth = Array(8)
  .fill(null)
  // create dates
  .map((_, i) => {
    // dummy date -> start of week and month (for convenience)
    const baseDateISO = "2021-03-01";
    const baseDateLuxon = DateTime.fromISO(baseDateISO);

    // we're putting two slots in each week
    const weekJump = Math.floor(i / 2);
    // one monday and one wednesday
    const dayJump = (i % 2) * 2;

    const resultDate = baseDateLuxon.plus({ weeks: weekJump, days: dayJump });
    return luxon2ISODate(resultDate);
  })
  // create a record keyed by iso dates (from last step)
  .reduce((acc, isoDate, i) => {
    // a fb Timestamp date calculated from key (ISO string)
    // start each slot at 9:00 am
    const date = luxonToFB(DateTime.fromISO(isoDate).plus({ hours: 9 }));

    // create a simple slot id from current index of the array
    const slotId = `slot-${i}`;
    return {
      ...acc,
      [isoDate]: {
        [slotId]: { ...dummySlot, id: slotId, type: SlotType.Ice, date },
      },
    };
  }, {} as Record<string, Record<string, Slot<"id">>>);
// #endregion slot

/**
 * Dummy week of slots (resembling a structure we should receive from store).
 * Used for `CustomerRoute="book_off_ice"`
 */
export const slotsWeek = Array(7)
  .fill(null)
  // create dates
  .map((_, i) => {
    // dummy date -> start of week and month (for convenience)
    const baseDateISO = "2021-03-01";
    const baseDateLuxon = DateTime.fromISO(baseDateISO);

    const resultDate = baseDateLuxon.plus({ days: i });
    return luxon2ISODate(resultDate);
  })
  // create a record keyed by iso dates (from last step)
  .reduce((acc, isoDate, i) => {
    // a fb Timestamp date calculated from key (ISO string)
    // start each slot at 9:00 am
    const date = luxonToFB(DateTime.fromISO(isoDate).plus({ hours: 9 }));

    // create a simple slot id from current index of the array
    const slotId = `slot-${i}`;
    return {
      ...acc,
      [isoDate]: {
        [slotId]: { ...dummySlot, id: slotId, type: SlotType.Ice, date },
      },
    };
  }, {} as Record<string, Record<string, Slot<"id">>>);
// #endregion slot
