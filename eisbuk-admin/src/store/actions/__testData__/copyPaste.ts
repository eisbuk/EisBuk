import { Timestamp } from "@google-cloud/firestore";

import { SlotsById } from "eisbuk-shared";

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
 * Wednessday of test week (for slots in the same week, different day)
 */
const twoDaysFromNow = testDateLuxon.plus({ days: 2 });
const newTimestamp = { seconds: twoDaysFromNow.toSeconds() } as Timestamp;
/**
 * Slots belonging to test week (keyed only by slot id)
 */
const testWeek = {
  ...testDay,
  ["slot-2"]: {
    ...baseSlot,
    id: "slot-2",
    date: newTimestamp,
  },
  ["slot-3"]: {
    ...baseSlot,
    id: "slot-3",
    date: newTimestamp,
  },
  ["slot-4"]: {
    ...baseSlot,
    id: "slot-4",
    date: newTimestamp,
  },
};
/**
 * Next week for test data, keyed only by slot id (should get filtered out)
 */
const nextWeek = Array(3)
  .fill(testDateLuxon)
  .reduce((acc, baseDate, i) => {
    const slotId = `dummy-slot-${i}`;
    const luxonDay = baseDate.plus({ weeks: 1, days: i * 2 });
    const timestamp = { seconds: luxonDay.toSeconds() } as Timestamp;

    return {
      ...acc,
      [slotId]: { ...baseSlot, date: timestamp, id: slotId },
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
