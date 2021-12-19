import { DateTime } from "luxon";

import { LocalStore } from "@/types/store";

import { getCustomersByBirthday } from "../customers";

import { createTestStore } from "@/__testUtils__/firestore";
import {
  customers,
  expectedCustomersBirthdays,
} from "../__testData__/customers";
import { jian } from "@/__testData__/customers";

describe("Customer Selectors", () => {
  describe("Customers birthdays", () => {
    test("should get customers sorted according to their birthday", () => {
      const testStore = createTestStore({ data: { customers } });
      const selector = getCustomersByBirthday(DateTime.now().toString());
      // test created selector against test store state
      const res = selector(testStore as LocalStore);
      expect(res).toEqual(expectedCustomersBirthdays);
    });

    test("should omit customers with no birthday specified", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { birthday, ...erlich } = jian;
      const selector = getCustomersByBirthday(DateTime.now().toString());
      const testStore = createTestStore({
        data: { customers: { ...customers, erlich } },
      });
      // test created selector against test store state
      const res = selector(testStore as LocalStore);
      // the result should be the same as erlich doesn't have a birthday provided
      expect(res).toEqual(expectedCustomersBirthdays);
    });
  });
});
