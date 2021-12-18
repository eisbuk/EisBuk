import { DateTime } from "luxon";

import { LocalStore } from "@/types/store";

import { getCustomersWithBirthday } from "../customers";

import {
  testStore,
  expectedCustomersBirthdays,
} from "../__testData__/customers";

describe("Customer Selectors", () => {
  describe("Customers birthdays", () => {
    test("should get customers sorted according to their birthday", () => {
      const selector = getCustomersWithBirthday(DateTime.now().toString());
      // test created selector against test store state
      const res = selector(testStore as LocalStore);
      expect(res).toEqual(expectedCustomersBirthdays);
    });
  });
});
