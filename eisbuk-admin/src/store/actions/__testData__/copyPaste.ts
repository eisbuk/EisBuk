import { SlotsById, luxon2ISODate } from "eisbuk-shared";

import { testDateLuxon } from "@/__testData__/date";
import { baseSlot } from "@/__testData__/dummyData";

/**
 * Day we'll be using to test copy/paste slots day
 */
export const testDay = {
  ["slot-0"]: {
    ...baseSlot,
    id: "slot-0",
  },
  ["slot-1"]: {
    ...baseSlot,
    id: "slot-1",
  },
};

/**
 * Wednesday of test week (for slots in the same week, different day)
 */
const twoDaysFromNow = testDateLuxon.plus({ days: 2 });
const newDateISO = luxon2ISODate(twoDaysFromNow);
export const testWeekWednesday = {
  ["slot-2"]: {
    ...baseSlot,
    id: "slot-2",
    date: newDateISO,
  },
  ["slot-3"]: {
    ...baseSlot,
    id: "slot-3",
    date: newDateISO,
  },
  ["slot-4"]: {
    ...baseSlot,
    id: "slot-4",
    date: newDateISO,
  },
};
export const wednesdaySlotIds = Object.keys(testWeekWednesday);
/**
 * Slots belonging to test week (keyed only by slot id)
 */
export const testWeek = {
  ...testDay,
  ...testWeekWednesday,
};
/**
 * Next week for test data, keyed only by slot id (should get filtered out)
 */
const nextWeek = Array(3)
  .fill(testDateLuxon)
  .reduce((acc, baseDate, i) => {
    const slotId = `dummy-slot-${i}`;
    const luxonDay = baseDate.plus({ weeks: 1, days: i * 2 });
    const date = luxon2ISODate(luxonDay);

    return {
      ...acc,
      [slotId]: { ...baseSlot, date, id: slotId },
    };
  }, {} as SlotsById);
/**
 * All test slots used to populate the initial store
 */
export const testSlots = { ...testWeek, ...nextWeek };

/**
 * Expected structure to be dispatched on `copySlotsDay` test
 */
export const expectedDay = testDay;
/**
 * Expected structure to be dispatched on `copySlotsWeek` test
 */
export const expectedWeek = {
  weekStart: testDateLuxon,
  slots: Object.values(testWeek),
};
