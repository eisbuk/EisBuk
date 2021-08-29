import { DateTime } from "luxon";

import { Category } from "eisbuk-shared";

import { __storybookDate__ } from "@/lib/constants";

import { LocalStore } from "@/types/store";

import { getSlotsForCustomer } from "../slots";

import {
  testStoreState,
  currentWeekCompetitive,
  currentMonthCompetitive,
} from "../__testData__/dummyData";

describe("Slot selectors > ", () => {
  describe("'getSlotsForCustomer' > ", () => {
    const testDate = DateTime.fromISO(__storybookDate__);

    test("if 'timeframe=\"month\"' should get slots for a month with respect to 'startDate' and provided category", () => {
      // create a selector curried with `timeframe` and `date` params (like we will be doing within the component)
      const selector = getSlotsForCustomer(
        Category.Competitive,
        "month",
        testDate
      );
      // test created selector against test store state
      const res = selector(testStoreState as LocalStore);
      expect(res).toEqual(currentMonthCompetitive);
    });

    test("if 'timeframe=\"week\"' should get slots for a week with respect to 'startDate' and provided category", () => {
      // create a selector curried with `timeframe` and `date` params (like we will be doing within the component)
      const selector = getSlotsForCustomer(
        Category.Competitive,
        "week",
        testDate
      );
      // test created selector against test store state
      const res = selector(testStoreState as LocalStore);
      expect(res).toEqual(currentWeekCompetitive);
    });
  });
});
