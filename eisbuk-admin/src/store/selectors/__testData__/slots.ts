import { DateTime } from "luxon";

import { Category, SlotType, luxon2ISODate, SlotsByDay } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import { createTestStore } from "@/__testUtils__/firestore";

import { baseSlot } from "@/__testData__/slots";

/**
 * Start date of `currentWeek` we'll be using for tests
 */
export const currentWeekStartDate = "2021-08-30";
/**
 * Start date of `currentMonth` we'll be using for tests
 */
export const currentMonthStartDate = "2021-09-01";

// #region previousMonth
/**
 * @region This region contains all slots belonging to the previous month (2021-08),
 * including the ones from `currentWeek`
 */

/**
 * This is the week prior to `currentWeek` (2021-08-23 - 2021-08-29) and should alway get filtered out.
 */
const prevoiusWeek = {
  "2021-08-23": {
    ["slot-0"]: {
      ...baseSlot,
      categories: [Category.Competitive],
      id: "slot-0",
      type: SlotType.Ice,
    },
  },
  "2021-08-24": {
    ["slot-1"]: {
      ...baseSlot,
      categories: [Category.PreCompetitive],
      id: "slot-1",
      type: SlotType.OffIce,
    },
  },
  "2021-08-25": {
    ["slot-2"]: {
      ...baseSlot,
      categories: [Category.Course],
      id: "slot-2",
      type: SlotType.OffIce,
    },
  },
};

/**
 * Start of `currentWeek` (2021-08-30 - 2021-09-05) belonging to the `prevMonth` (2021-08)
 */
export const currentWeekPrevMonth = {
  "2021-08-31": {
    ["slot-3"]: {
      ...baseSlot,
      id: "slot-3",
      categories: [Category.Competitive, Category.Course],
      type: SlotType.Ice,
    },
  },
};

const fullPrevoiusMonth = { ...prevoiusWeek, ...currentWeekPrevMonth };
// #region previousMonth

// #region currentMonth
/**
 * @region This region contains all slots belonging to the current month (2021-09),
 * including the ones from `currentWeek` and `nextWeek`
 */

/**
 * Slots of `currentWeek`  belonging to `currentMonth` (2021-09)
 * with `catgories` including `Category.Competitive`
 */
const currentWeekThisMonthCompetitive = {
  "2021-09-01": {
    ["slot-4"]: {
      ...baseSlot,
      id: "slot-4",
      categories: [Category.Competitive, Category.PreCompetitive],
      type: SlotType.Ice,
    },
  },
  "2021-09-03": {
    ["slot-5"]: {
      ...baseSlot,
      id: "slot-5",
      categories: [Category.Competitive],
      type: SlotType.OffIce,
    },
  },
};
/**
 * Slots belonging to `currentMonth` part of `currentWeek`.
 * Should be displayed for admin, but filtered out for customer as they're not of
 * wanted category (`Category.Competitive`)
 */
const currentWeekNonCompetitive = {
  "2021-09-01": {
    ["slot-6"]: {
      ...baseSlot,
      id: "slot-6",
      categories: [Category.PreCompetitive],
      type: SlotType.Ice,
    },
  },
  "2021-09-03": {
    ["slot-7"]: {
      ...baseSlot,
      id: "slot-7",
      categories: [Category.PreCompetitive],
      type: SlotType.OffIce,
    },
  },
};
/**
 * Entry for `currentWeek` of this month with slots belonging to both competitive and non-competitive category
 */
const currentWeekThisMonth = Object.keys(
  currentWeekThisMonthCompetitive
).reduce(
  (acc, isoDate) => ({
    ...acc,
    [isoDate]: {
      ...currentWeekThisMonthCompetitive[isoDate],
      ...currentWeekNonCompetitive[isoDate],
    },
  }),
  {} as SlotsByDay
);
/**
 * Slot belonging to the week after the `currentWeek` (2021-08-30 - 2021-09-05), should get filtered out on "week"
 * timeframe test
 */
const nextWeekCompetitive = {
  "2021-09-06": {
    ["slot-8"]: {
      ...baseSlot,
      id: "slot-8",
      categories: [Category.Competitive, Category.PreCompetitive],
      type: SlotType.Ice,
    },
  },
  "2021-09-07": {
    ["slot-9"]: {
      ...baseSlot,
      id: "slot-9",
      categories: [Category.Competitive],
      type: SlotType.OffIce,
    },
  },
};
/**
 * Slots of `nextWeek` (2021-09-06 - 2021-09-12) belonging not belonging to `Category.Competitive`.
 * Should get filtered out in tests anyhow.
 */
const nextWeekNonCompetitive = {
  "2021-09-06": {
    ["slot-10"]: {
      ...baseSlot,
      id: "slot-10",
      categories: [Category.PreCompetitive],
      type: SlotType.Ice,
    },
  },
  "2021-09-07": {
    ["slot-11"]: {
      ...baseSlot,
      id: "slot-11",
      categories: [Category.PreCompetitive],
      type: SlotType.OffIce,
    },
  },
};
/**
 * Second week of `currentMonth` including both `Category.Competitive` slots and different category.
 */
const fullNextWeek = Object.keys(nextWeekCompetitive).reduce(
  (acc, isoDate) => ({
    ...acc,
    [isoDate]: {
      ...nextWeekCompetitive[isoDate],
      ...nextWeekNonCompetitive[isoDate],
    },
  }),
  {} as SlotsByDay
);
/**
 * Current month slots with `Category.Competitive`
 */
const currentMonthCompetitive = {
  ...currentWeekThisMonthCompetitive,
  ...nextWeekCompetitive,
};
/**
 * Full current month for test store
 */
const fullCurrentMonth = { ...currentWeekThisMonth, ...fullNextWeek };
// #endregion currentMonth

// #region testData
/**
 * @region This region contains the data we're expecting from tests
 */

/**
 * Empty slot days we're expecting to be returned when `slotsByDay` is undefined.
 * Also used as basis for existing slots (to fill out empty days)
 */
export const emptyWeek = Array(7)
  .fill(currentWeekStartDate)
  .map((date, i) => {
    const luxonDate = DateTime.fromISO(date).plus({ days: i });
    return luxon2ISODate(luxonDate);
  })
  .reduce((acc, date) => ({ ...acc, [date]: {} }), {});

/**
 * Slots we're expecting when testing admin selector for `week` timerframe
 */
export const expectedWeekAdmin = {
  ...emptyWeek,
  ...currentWeekPrevMonth,
  ...currentWeekThisMonth,
};
/**
 * Slots we're expecting when testing customer selector for `week` timerframe
 * (only `Category.Competitive` slots)
 */
export const expectedWeekCustomer = {
  ...emptyWeek,
  ...currentWeekPrevMonth,
  ...currentWeekThisMonthCompetitive,
};
/**
 * A full month of slots, expected when testing admin selector for `month` timeframe
 */
export const expectedMonthCustomer = currentMonthCompetitive;

/**
 * A full `slotsByDay` test store input
 */
export const slotsByDay: LocalStore["firestore"]["data"]["slotsByDay"] = {
  ["2021-08"]: fullPrevoiusMonth,
  ["2021-09"]: fullCurrentMonth,
};
// #endregion testData

// #region inputTestData
/**
 * Test store populated with slots we're using to test the selector
 */
export const testStore = createTestStore({
  data: { slotsByDay },
  date: DateTime.fromISO(currentWeekStartDate),
});
/**
 * Test store without slots entry, to test falling back to empty days
 */
export const noSlotsStore = createTestStore({
  data: { slotsByDay: null },
  date: DateTime.fromISO(currentWeekStartDate),
});
// #endregion inputTestData
