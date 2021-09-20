import { LocalStore } from "@/types/store";
import { AttendanceCardProps } from "@/components/atoms/AttendanceCard";

import { luxon2ISODate } from "@/utils/date";

import { createTestStore } from "@/__testUtils__/firestore";

import { testDate, testDateLuxon, timestampDate } from "@/__testData__/date";
import { baseSlot, createIntervals } from "@/__testData__/dummyData";
import { walt, jian, saul } from "@/__testData__/customers";

/**
 * Test intervals ("09:00-10:00", "10:00-11:00", "09:00-11:00")
 */
const intervals9 = createIntervals(9);
const intervals9Keys = Object.keys(intervals9);
/**
 * Test intervals ("12:00-13:00", "13:00-14:00", "12:00-14:00")
 */
const intervals12 = createIntervals(12);
const intervals12Keys = Object.keys(intervals12);
/**
 * Test intervals ("15:00-16:00", "16:00-17:00", "15:00-17:00")
 */
const intervals15 = createIntervals(15);
const intervals15Keys = Object.keys(intervals15);

/**
 * Customer we're using for tests
 */
const customers = {
  [walt.id]: walt,
  [jian.id]: jian,
  [saul.id]: saul,
};

/**
 * Slots in a "current day" we're testing for
 */
const slotsForADay = {
  ["slot-0"]: { ...baseSlot, intervals: intervals9 },
  ["slot-1"]: { ...baseSlot, intervals: intervals12 },
  ["slot-2"]: { ...baseSlot, intervals: intervals15 },
};
/**
 * Slots in a next day of our "current day" (should get filtered out by the selector in test)
 */
const slotsForNextDay = {
  ["slot-3"]: { ...baseSlot, intervals: intervals9 },
  ["slot-4"]: { ...baseSlot, intervals: intervals12 },
  ["slot-5"]: { ...baseSlot, intervals: intervals15 },
};

const monthString = testDate.substr(0, 7);
const nextDayISO = luxon2ISODate(testDateLuxon.plus({ days: 1 }));

/**
 * `slotsByDay` entry in test store
 */
const slotsByDay = {
  [monthString]: {
    [testDate]: slotsForADay,
    [nextDayISO]: slotsForNextDay,
  },
};

/**
 * Simulated attendance redux entries
 */
const attendance: LocalStore["firestore"]["data"]["attendance"] = {
  ["slot-0"]: {
    date: timestampDate,
    attendances: {
      [walt.id]: {
        bookedInterval: null,
        attendedInterval: intervals9Keys[0],
      },
      [jian.id]: {
        bookedInterval: intervals9Keys[0],
        attendedInterval: intervals9Keys[0],
      },
      [saul.id]: {
        bookedInterval: intervals9Keys[1],
        attendedInterval: intervals9Keys[0],
      },
    },
  },
  ["slot-1"]: {
    date: timestampDate,
    attendances: {
      [jian.id]: {
        bookedInterval: intervals12Keys[1],
        attendedInterval: intervals12Keys[1],
      },
    },
  },
  ["slot-2"]: {
    date: timestampDate,
    attendances: {
      [walt.id]: {
        bookedInterval: intervals15Keys[2],
        attendedInterval: intervals15Keys[2],
      },
    },
  },
  ["slot-3"]: {
    date: timestampDate,
    attendances: {
      [walt.id]: {
        bookedInterval: null,
        attendedInterval: intervals9Keys[0],
      },
      [jian.id]: {
        bookedInterval: intervals9Keys[0],
        attendedInterval: intervals9Keys[0],
      },
      [saul.id]: {
        bookedInterval: intervals9Keys[1],
        attendedInterval: intervals9Keys[0],
      },
    },
  },
  ["slot-4"]: {
    date: timestampDate,
    attendances: {
      [walt.id]: {
        bookedInterval: null,
        attendedInterval: intervals9Keys[0],
      },
      [jian.id]: {
        bookedInterval: intervals9Keys[0],
        attendedInterval: intervals9Keys[0],
      },
      [saul.id]: {
        bookedInterval: intervals9Keys[1],
        attendedInterval: intervals9Keys[0],
      },
    },
  },
  ["slot-5"]: {
    date: timestampDate,
    attendances: {
      [walt.id]: {
        bookedInterval: null,
        attendedInterval: intervals9Keys[0],
      },
      [jian.id]: {
        bookedInterval: intervals9Keys[0],
        attendedInterval: intervals9Keys[0],
      },
      [saul.id]: {
        bookedInterval: intervals9Keys[1],
        attendedInterval: intervals9Keys[0],
      },
    },
  },
};

/**
 * Store populated with test data for attendance selector test
 */
export const testStore = createTestStore(
  { attendance, customers, slotsByDay },
  testDateLuxon
);

/**
 * The struct we're expecting to receive for selector's test result (for test date)
 */
export const expectedStruct: Omit<AttendanceCardProps, "allCustomers">[] = [
  {
    ...slotsForADay["slot-0"],
    customers: [
      {
        ...walt,
        ...attendance["slot-0"].attendances[walt.id],
      },
      {
        ...jian,
        ...attendance["slot-0"].attendances[jian.id],
      },
      {
        ...saul,
        ...attendance["slot-0"].attendances[saul.id],
      },
    ],
  },
  {
    ...slotsForADay["slot-1"],
    customers: [
      {
        ...jian,
        ...attendance["slot-1"].attendances[jian.id],
      },
    ],
  },
  {
    ...slotsForADay["slot-2"],
    customers: [
      {
        ...walt,
        ...attendance["slot-2"].attendances[walt.id],
      },
    ],
  },
];
