import { DateTime } from "luxon";

import { Category, SlotType } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import { luxon2ISODate } from "@/utils/date";

import { createTestStore } from "@/__testUtils__/firestore";

import { baseSlot } from "@/__testData__/dummyData";

/**
 * Start date of `currentWeek` we'll be using for tests
 */
export const currentWeekStartDate = "2021-08-30";
/**
 * Start date of `currentMonth` we'll be using for tests
 */
export const currentMonthStartDate = "2021-09-01";
/**
 * A week prior to `currentWeek` (2021-08-30 - 2021-09-05), should alway get filtered out.
 */
const prevWeek = {
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
      type: SlotType.OffIceDancing,
    },
  },
  "2021-08-25": {
    ["slot-2"]: {
      ...baseSlot,
      categories: [Category.Course],
      id: "slot-2",
      type: SlotType.OffIceGym,
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
/**
 * Slots of `currentWeek`  belonging to `currentMonth` (2021-09)
 */
export const currentWeekThisMonth = {
  "2021-09-01": {
    ["slot-4"]: {
      ...baseSlot,
      id: "slot-4",
      categories: [Category.Adults],
      type: SlotType.Ice,
    },
  },
  "2021-09-03": {
    ["slot-5"]: {
      ...baseSlot,
      id: "slot-5",
      categories: [Category.Course],
      type: SlotType.OffIceGym,
    },
  },
};
/**
 * Slot belonging to the week after the `currentWeek` (2021-08-30 - 2021-09-05), should get filtered out on "week"
 * timeframe test
 */
const nextWeek = {
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
      categories: [],
      type: SlotType.OffIceGym,
    },
  },
};
/**
 * All slots of the `prevMonth` (2021-08) we're using as part of input data to our selector
 */
const prevMonth = { ...prevWeek, ...currentWeekPrevMonth };
/**
 * Current month entry for test store (should take only the current week part and filter out next week)
 */
const currentMonth = { ...currentWeekThisMonth, ...nextWeek };
/**
 * Slots we're expecting when testing for `startDate: "2021-08-30"`
 */
export const expectedWeek = {
  // fill week with empty days so that we have each day of the week regardless of it being empty or not
  ...Array(7)
    .fill(currentWeekStartDate)
    .map((date, i) => {
      const luxonDate = DateTime.fromISO(date).plus({ days: i });
      return luxon2ISODate(luxonDate);
    })
    .reduce((acc, date) => ({ ...acc, [date]: {} }), {}),
  ...currentWeekPrevMonth,
  ...currentWeekThisMonth,
};

/**
 * A full `slotsByDay` test store input
 */
const slotsByDay: LocalStore["firestore"]["data"]["slotsByDay"] = {
  ["2021-08"]: prevMonth,
  ["2021-09"]: currentMonth,
};

export const testStore = createTestStore(
  { slotsByDay },
  DateTime.fromISO(currentWeekStartDate)
);
