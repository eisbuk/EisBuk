import { DateTime } from "luxon";

import { Category } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import { getAdminSlots, getSlotsForCustomer } from "../slots";

import {
  currentWeekStartDate,
  currentMonthStartDate,
  testStoreState,
  expectedWeek,
  expectedMonth,
} from "../__testData__/dummyData";
import {
  testStore,
  expectedWeek as expectedWeekAdmin,
} from "../__testData__/slots";

describe("Slot selectors > ", () => {
  xdescribe("'getSlotsForCustomer' > ", () => {
    test("should get slots for a month with respect to 'startDate' and provided category if 'timeframe=\"month\"'", () => {
      const testDate = DateTime.fromISO(currentMonthStartDate);
      // create a selector curried with `timeframe` and `date` params (like we will be doing within the component)
      const selector = getSlotsForCustomer(
        Category.Competitive,
        "month",
        testDate
      );
      // test created selector against test store state
      const res = selector(testStoreState as LocalStore);
      expect(res).toEqual(expectedMonth);
    });

    test("should get slots for a week with respect to 'startDate' and provided category if 'timeframe=\"week\"'", () => {
      const testDate = DateTime.fromISO(currentWeekStartDate);
      // create a selector curried with `timeframe` and `date` params (like we will be doing within the component)
      const selector = getSlotsForCustomer(
        Category.Competitive,
        "week",
        testDate
      );
      // test created selector against test store state
      const res = selector(testStoreState as LocalStore);
      expect(res).toEqual(expectedWeek);
    });
  });

  describe("Test 'getAdminSlots' selector", () => {
    test("should get all slots for given week", () => {
      const slotsForWeek = getAdminSlots(testStore);
      expect(slotsForWeek).toEqual(expectedWeekAdmin);
    });
  });
});
