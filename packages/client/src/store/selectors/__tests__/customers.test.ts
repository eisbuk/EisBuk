import { describe, expect, test } from "vitest";
import { DateTime } from "luxon";

import { LocalStore } from "@/types/store";

import { getNewStore } from "@/store/createStore";

import { getCustomersByBirthday } from "../customers";

import { saul, walt, jian, mike, jane } from "@eisbuk/test-data/customers";

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
});
