import { DateTime } from "luxon";

import { getNewStore } from "@/store/createStore";

import { getCustomersByBirthday } from "../customers";

import {
  customers,
  expectedCustomersBirthdays,
} from "../__testData__/customers";
import { jian } from "@/__testData__/customers";

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
      const selector = getCustomersByBirthday(
        DateTime.fromFormat("2021-12-22", "yyyy-MM-dd")
      );
      const res = selector(store.getState());
      expect(res).toEqual(expectedCustomersBirthdays);
    });

    test("should omit customers with no birthday specified", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { birthday, ...erlich } = jian;
      const store = getNewStore({
        firestore: {
          data: {
            customers: { ...customers, erlich },
          },
        },
      });
      const selector = getCustomersByBirthday(
        DateTime.fromFormat("2021-12-22", "yyyy-MM-dd")
      );
      const res = selector(store.getState());
      // the result should be the same as erlich doesn't have a birthday provided
      expect(res).toEqual(expectedCustomersBirthdays);
    });
  });
});
