import { describe, expect, test } from "vitest";
import { DateTime } from "luxon";

import { Category, Customer, SlotType } from "@eisbuk/shared";

import { saul, walt, jian, mike, jane, gus } from "@eisbuk/testing/customers";
import { baseSlot } from "@eisbuk/testing/slots";

import { LocalStore } from "@/types/store";

import { getNewStore } from "@/store/createStore";

import {
  getCustomerByNoCategories,
  getCustomersByBirthday,
  getCustomersWithStats,
} from "../customers";

const intervals = Object.keys(baseSlot.intervals);

const customers: LocalStore["firestore"]["data"]["customers"] = {
  [saul.id]: {
    ...saul,
    birthday: "1990-01-22",
  },
  [jian.id]: {
    ...jian,
    birthday: "1993-01-22",
  },
  [walt.id]: {
    ...walt,
    birthday: "1995-01-22",
  },
  [mike.id]: {
    ...mike,
    birthday: "2012-12-25",
  },
  [jane.id]: { ...jane, birthday: "2000-12-22" },
};

const expectedCustomersBirthdays = [
  {
    date: "12-22",
    customers: [{ ...jane, birthday: "2000-12-22" }],
  },
  {
    date: "12-25",
    customers: [{ ...mike, birthday: "2012-12-25" }],
  },
  {
    date: "01-22",
    customers: [
      { ...saul, birthday: "1990-01-22" },
      { ...jian, birthday: "1993-01-22" },
      { ...walt, birthday: "1995-01-22" },
    ],
  },
];

const monthStr = "2022-01";
const nextMonthStr = "2022-02";
const days = [
  "2022-01-01",
  "2022-02-01",
  "2022-01-02",
  "2022-01-03",
  "2022-02-02",
  "2022-02-03",
];

// Construct slots
const [slot1ThisMonthIce, slot2NextMonthIce, slot3ThisMonthIce] = Array(3)
  .fill(null)
  .map((_, i) => ({
    ...baseSlot,
    // Results in: slot-1, slot-2, slot-3
    id: `${days[i]}-${9 + i}`,
    categories: [Category.Competitive],
    date: days[i],
    type: SlotType.Ice,
  }));
const [slot4ThisMonthOffIce, slot5NextMonthOffIce, slot6NextMonthOffIce] =
  Array(3)
    .fill(null)
    .map((_, i) => ({
      ...baseSlot,
      // Results in: slot-4, slot-5, slot-6
      id: `${days[i + 3]}-9`,
      categories: [Category.Competitive],
      date: days[i + 3],
      type: SlotType.OffIce,
    }));

const [day1, day2, day3, day4, day5, day6] = days;
const testDate = DateTime.fromISO(day3);

const slotsByDay = {
  [monthStr]: {
    [day1]: { [slot1ThisMonthIce.id]: slot1ThisMonthIce },
    [day3]: { [slot3ThisMonthIce.id]: slot3ThisMonthIce },
    [day4]: { [slot4ThisMonthOffIce.id]: slot4ThisMonthOffIce },
  },
  [nextMonthStr]: {
    [day2]: { [slot2NextMonthIce.id]: slot2NextMonthIce },
    [day5]: { [slot5NextMonthOffIce.id]: slot5NextMonthOffIce },
    [day6]: { [slot6NextMonthOffIce.id]: slot6NextMonthOffIce },
  },
};

describe("Customer Selectors", () => {
  describe("Customers birthdays", () => {
    test("should get customers sorted according to their birthday", () => {
      const store = getNewStore({
        firestore: {
          data: {
            customers,
          },
        },
      });
      const selector = getCustomersByBirthday(DateTime.fromISO("2021-12-22"));
      const res = selector(store.getState());
      expect(res).toEqual(expectedCustomersBirthdays);
    });

    test("should omit customers with no birthday specified", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { birthday, ...erlich } = jian;
      const selector = getCustomersByBirthday(DateTime.fromISO("2021-12-22"));
      const store = getNewStore({
        firestore: {
          data: {
            customers: { ...customers, erlich },
          },
        },
      });

      const res = selector(store.getState());
      // the result should be the same as erlich doesn't have a birthday provided
      expect(res).toEqual(expectedCustomersBirthdays);
    });
  });

  describe("Athletes approval", () => {
    test("should get customers with no categories", () => {
      const store = getNewStore({
        firestore: {
          data: {
            customers: {
              [saul.id]: saul,
              [gus.id]: gus,
              [jian.id]: jian,
            },
          },
        },
      });
      const selector = getCustomerByNoCategories();
      const res = selector(store.getState());
      expect(res).toEqual([{ ...gus }]);
    });
  });

  describe("getCustomerWithStats", () => {
    test("should return customer as is if slotsByDay is empty", async () => {
      const store = getNewStore({
        firestore: {
          data: {
            customers,
            bookings: {
              [saul.secretKey]: { ...saul } as Customer,
            },
          },
        },
      });

      const res = getCustomersWithStats(store.getState());

      expect(res).toEqual([
        {
          ...saul,
        },
      ]);
    });

    test("should return customer as is if customer has no bookedSlots", async () => {
      const store = getNewStore({
        firestore: {
          data: {
            customers,
            slotsByDay,
            bookings: {
              [saul.secretKey]: { ...saul } as Customer,
            },
          },
        },
      });

      const res = getCustomersWithStats(store.getState());

      expect(res).toEqual([
        {
          ...saul,
        },
      ]);
    });

    test("should return bookings as is if customer is deleted", async () => {
      const store = getNewStore({
        firestore: {
          data: {
            customers,
            slotsByDay,
            bookings: {
              [saul.secretKey]: { ...saul, deleted: true } as Customer,
            },
          },
        },
      });

      const res = getCustomersWithStats(store.getState());

      expect(res).toEqual([
        {
          ...saul,
          deleted: true,
        },
      ]);
    });

    test("should get zero hour booking stats if customer booked no slots this or next month", async () => {
      // const testDate = DateTime.fromISO(baseSlot.date);

      // baseSlot date: "2021-03-01"
      const bookedSlots = {
        [`${day1}-9`]: {
          date: baseSlot.date,
          interval: intervals[0],
        },
        [`${day2}-10`]: {
          date: baseSlot.date,
          interval: intervals[0],
        },
      };

      const store = getNewStore({
        firestore: {
          data: {
            customers,
            slotsByDay,
            bookings: {
              [saul.secretKey]: { ...saul, bookedSlots } as Customer,
            },
          },
        },
      });

      const res = getCustomersWithStats(store.getState());

      expect(res).toEqual([
        {
          ...saul,
          bookedSlots,
          bookingStats: {
            nextMonthIce: 0,
            nextMonthOffIce: 0,
            thisMonthIce: 0,
            thisMonthOffIce: 0,
          },
        },
      ]);
    });

    test("should get booking stats if slots have been booked this and next month", async () => {
      const bookedSlotsSaul = {
        // this month ice
        [`${day1}-9`]: {
          date: day1,
          interval: intervals[0],
        },
        // next month off ice
        [`${day5}-9`]: {
          date: day5,
          interval: intervals[1],
        },
        // next month ice
        [`${day2}-10`]: {
          date: day2,
          interval: "10:00-13:00",
        },
      };
      const bookedSlotsWalt = {
        // this month ice
        [`${day1}-9`]: {
          date: day1,
          interval: intervals[0],
        },
        // this month ice
        [`${day3}-11`]: {
          date: day3,
          interval: "11:00-13:00",
        },
        // this month off ice
        [`${day4}-9`]: {
          date: day4,
          interval: intervals[0],
        },
        // next month off ice
        [`${day6}-9`]: {
          date: day6,
          interval: intervals[0],
        },
      };

      const store = getNewStore({
        app: {
          calendarDay: testDate,
        },
        firestore: {
          data: {
            customers,
            slotsByDay,
            bookings: {
              [saul.secretKey]: {
                ...saul,
                bookedSlots: bookedSlotsSaul,
              } as Customer,
              [walt.secretKey]: {
                ...walt,
                bookedSlots: bookedSlotsWalt,
              } as Customer,
            },
          },
        },
      });

      const res = getCustomersWithStats(store.getState());

      expect(res).toEqual([
        {
          ...saul,
          bookedSlots: bookedSlotsSaul,
          bookingStats: {
            thisMonthIce: 1,
            thisMonthOffIce: 0,
            nextMonthIce: 3,
            nextMonthOffIce: 1,
          },
        },
        {
          ...walt,
          bookedSlots: bookedSlotsWalt,
          bookingStats: {
            thisMonthIce: 3,
            thisMonthOffIce: 1,
            nextMonthIce: 0,
            nextMonthOffIce: 1,
          },
        },
      ]);
    });
  });
});
