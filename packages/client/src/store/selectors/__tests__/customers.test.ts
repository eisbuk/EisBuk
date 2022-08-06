import { OrgSubCollection } from "@eisbuk/shared";

import { getNewStore } from "@/store/createStore";

import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";

import { getCustomersByBirthday } from "../customers";

import {
  customers,
  expectedCustomersBirthdays,
} from "../__testData__/customers";
import { jian } from "@/__testData__/customers";
import { DateTime } from "luxon";

describe("Customer Selectors", () => {
  describe("Customers birthdays", () => {
    test("should get customers sorted according to their birthday", () => {
      const store = getNewStore();
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.Customers, customers!)
      );
      const selector = getCustomersByBirthday(
        DateTime.fromFormat("2021-12-22", "yyyy-MM-dd")
      );
      const res = selector(store.getState());
      expect(res).toEqual(expectedCustomersBirthdays);
    });

    test("should omit customers with no birthday specified", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { birthday, ...erlich } = jian;
      const store = getNewStore();
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.Customers, {
          ...customers,
          erlich,
        })
      );
      const selector = getCustomersByBirthday(
        DateTime.fromFormat("2021-12-22", "yyyy-MM-dd")
      );
      const res = selector(store.getState());
      // the result should be the same as erlich doesn't have a birthday provided
      expect(res).toEqual(expectedCustomersBirthdays);
    });
  });
});
