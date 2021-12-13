import { LocalStore } from "@/types/store";

import {
  testStore,
  expectedCustomersBirthdays,
} from "../__testData__/customers";
import { getCustomersWithBirthday } from "../customers";
import { DateTime } from "luxon";

describe("Customer Selectors", () => {
  describe("Customers birthdays", () => {
    test("should get customers sorted according to their birthday", () => {
      const selector = getCustomersWithBirthday(DateTime.now());
      // test created selector against test store state
      const res = selector(testStore as LocalStore);
      expect(res).toEqual(expectedCustomersBirthdays);
    });
  });
});
