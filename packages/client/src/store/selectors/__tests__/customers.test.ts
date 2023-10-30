import { describe, expect, test } from "vitest";
import { DateTime } from "luxon";

import { Customer } from "@eisbuk/shared";

import { saul, walt, jian, mike, jane, gus } from "@eisbuk/testing/customers";
import { baseSlot } from "@eisbuk/testing/slots";

import { LocalStore } from "@/types/store";

import { getNewStore } from "@/store/createStore";

import {
  getCustomerByNoCategories,
  getCustomersByBirthday,
  getCustomersWithStats,
} from "../customers";

import { slotsByDay, currentWeekStartDate } from "../__testData__/slots";

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
    /** @TODO Set the date to be the first of the two months of the slots dates */
    /** @TODO text if there are no slotsByDay */
    /** @TODO text if there are no slotsByDay this month */
    /** @TODO text if there are no slotsByDay next month */
    test("should get zero hour booking stats if no slots have been booked this or next month", async () => {
      // const testDate = DateTime.fromISO(baseSlot.date);

      // date: "2021-03-01"
      const bookedSlots = {
        ["test-slot-1"]: {
          date: baseSlot.date,
          interval: intervals[0],
        },
        ["test-slot-2"]: {
          date: baseSlot.date,
          interval: intervals[0],
        },
      };

      const store = getNewStore({
        firestore: {
          data: {
            customers,
            slotsByDay,
            bookedSlots,
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
      const testDate = DateTime.fromISO(currentWeekStartDate);

      const bookedSlots = {
        ["test-slot-1"]: {
          date: testDate.toISODate(),
          interval: intervals[0],
        },
        ["test-slot-2"]: {
          date: testDate.plus({ months: 1 }).toISODate(),
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
            bookedSlots,
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
  });
});
