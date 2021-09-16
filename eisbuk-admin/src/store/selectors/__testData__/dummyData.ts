import { Category, SlotType, SlotsByDay } from "eisbuk-shared";
import { DateTime } from "luxon";

import { LocalStore } from "@/types/store";

import { dummySlot } from "@/__testData__/dummyData";

import { luxon2ISODate } from "@/utils/date";

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
      ...dummySlot,
      categories: [Category.Competitive],
      id: "slot-0",
      type: SlotType.Ice,
    },
  },
  "2021-08-24": {
    ["slot-1"]: {
      ...dummySlot,
      categories: [Category.PreCompetitive],
      id: "slot-1",
      type: SlotType.OffIceDancing,
    },
  },
  "2021-08-25": {
    ["slot-2"]: {
      ...dummySlot,
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
      ...dummySlot,
      id: "slot-3",
      categories: [Category.Competitive, Category.PreCompetitive],
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
      ...dummySlot,
      id: "slot-4",
      categories: [Category.Competitive, Category.PreCompetitive],
      type: SlotType.Ice,
    },
  },
  "2021-09-03": {
    ["slot-5"]: {
      ...dummySlot,
      id: "slot-5",
      categories: [Category.Competitive],
      type: SlotType.OffIceGym,
    },
  },
};

/**
 * Slot belonging to `currentMonth` part of `currentWeek`, but should get filtered out as they're not of
 * wanted category (`Category.Competitive`)
 */
const currentWeekNonCompetitive = {
  "2021-09-01": {
    ["slot-6"]: {
      ...dummySlot,
      id: "slot-6",
      categories: [Category.PreCompetitive],
      type: SlotType.Ice,
    },
  },
  "2021-09-03": {
    ["slot-7"]: {
      ...dummySlot,
      id: "slot-7",
      categories: [Category.PreCompetitive],
      type: SlotType.OffIceDancing,
    },
  },
};

/**
 * Slot belonging to the week after the `currentWeek` (2021-08-30 - 2021-09-05), should get filtered out on "week"
 * timeframe test, but included in "month" timeframe test
 */
const nextWeek = {
  "2021-09-06": {
    ["slot-8"]: {
      ...dummySlot,
      id: "slot-8",
      categories: [Category.Competitive, Category.PreCompetitive],
      type: SlotType.Ice,
    },
  },
  "2021-09-07": {
    ["slot-9"]: {
      ...dummySlot,
      id: "slot-9",
      categories: [Category.Competitive],
      type: SlotType.OffIceGym,
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
      ...dummySlot,
      id: "slot-10",
      categories: [Category.PreCompetitive],
      type: SlotType.Ice,
    },
  },
  "2021-09-07": {
    ["slot-11"]: {
      ...dummySlot,
      id: "slot-11",
      categories: [Category.PreCompetitive],
      type: SlotType.OffIceDancing,
    },
  },
};

/**
 * All slots of the `prevMonth` (2021-08) we're using as part of input data to our selector
 */
const prevMonth = { ...prevWeek, ...currentWeekPrevMonth };

/**
 * Slots we're expecting when testing for `{timeframe: "week", startDate: "2021-08-30", category: Category.Competitive"}`
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
 * Slots we're expecting when testing for `{timeframe: "month", startDate: "2021-09-01", category: Category.Competitive"}`
 */
export const expectedMonth = { ...currentWeekThisMonth, ...nextWeek };

/**
 * First week of `currentMonth` including both `Category.Competitive` slots and different category.
 */
const fullCurrentWeekThisMonth = Object.keys(currentWeekThisMonth).reduce(
  (acc, isoDate) => ({
    ...acc,
    [isoDate]: {
      ...currentWeekThisMonth[isoDate],
      ...currentWeekNonCompetitive[isoDate],
    },
  }),
  {} as SlotsByDay
);

/**
 * Second week of `currentMonth` including both `Category.Competitive` slots and different category.
 */
const fullNextWeek = Object.keys(nextWeek).reduce(
  (acc, isoDate) => ({
    ...acc,
    [isoDate]: {
      ...nextWeek[isoDate],
      ...nextWeekNonCompetitive[isoDate],
    },
  }),
  {} as SlotsByDay
);

/**
 * All slots of `currentMonth` (2021-09) we're using as part of test input.
 * Includes the expected slots and slots from different category (which should get filtered out)
 */
const currentMonth = { ...fullCurrentWeekThisMonth, ...fullNextWeek };

/**
 * A month we're providing to test filtering out dates after requested time frame in `getSlotsForCustomer`.
 */
const nextMonth = {
  "2021-10-01": {
    ["slot-12"]: {
      ...dummySlot,
      id: "slot-12",
      categories: [Category.Competitive],
      type: SlotType.OffIceDancing,
    },
  },
  "2021-10-09": {
    ["slot-13"]: {
      ...dummySlot,
      id: "slot-13",
      categories: [Category.PreCompetitive],
      type: SlotType.OffIceGym,
    },
  },
  "2021-10-10": {
    ["slot-14"]: {
      ...dummySlot,
      id: "slot-14",
      categories: [Category.Competitive, Category.PreCompetitive],
      type: SlotType.Ice,
    },
  },
};

/**
 * A full `slotsByDay` test store input
 */
const slotsByDay: LocalStore["firestore"]["data"]["slotsByDay"] = {
  ["2021-08"]: prevMonth,
  ["2021-09"]: currentMonth,
  ["2021-10"]: nextMonth,
} as any;

/**
 * An intermediate step (used for easier type casting).
 * `firestore` entry in store, populated with our dummy slot data.
 */
const firestore = {
  data: {
    slotsByDay,
  },
} as LocalStore["firestore"];

/**
 * Partial local store populated with our test slots (within `firestore.data.slotsByDay`).
 */
export const testStoreState: Partial<LocalStore> = {
  firestore,
};
