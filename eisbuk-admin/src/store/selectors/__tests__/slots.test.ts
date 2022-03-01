import { DateTime } from "luxon";

import { Category } from "eisbuk-shared";

import { LocalStore } from "@/types/store";

import { getAdminSlots, getSlotsForCustomer } from "../slots";

import {
  currentWeekStartDate,
  currentMonthStartDate,
  testStore,
  expectedWeekAdmin,
  noSlotsStore,
  emptyWeek,
  expectedMonthCustomer,
  expectedWeekCustomer,
} from "../__testData__/slots";

describe("Slot selectors > ", () => {
  describe("'getSlotsForCustomer' > ", () => {
    test("should get slots for a month with respect to 'startDate' and provided category if 'timeframe=\"month\"'", () => {
      const testDate = DateTime.fromISO(currentMonthStartDate);
      // create a selector curried with `timeframe` and `date` params (like we will be doing within the component)
      const selector = getSlotsForCustomer(
        Category.Competitive,
        "month",
        testDate
      );
      // test created selector against test store state
      const res = selector(testStore as LocalStore);
      expect(res).toEqual(expectedMonthCustomer);
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
      const res = selector(testStore as LocalStore);
      expect(res).toEqual(expectedWeekCustomer);
    });

    test("should get slots for a week even if passed non-week-start-date", () => {
      const testDate = DateTime.fromISO(currentWeekStartDate).plus({ days: 1 });
      // create a selector curried with `timeframe` and `date` params (like we will be doing within the component)
      const selector = getSlotsForCustomer(
        Category.Competitive,
        "week",
        testDate
      );
      // test created selector against test store state
      const res = selector(testStore as LocalStore);
      expect(res).toEqual(expectedWeekCustomer);
    });
  });

  describe("Test 'getAdminSlots' selector", () => {
    test("should get all slots for given week", () => {
      const slotsForWeek = getAdminSlots(testStore);
      expect(slotsForWeek).toEqual(expectedWeekAdmin);
    });

    test("should return empty days if no slots in store ('slotsByDay' = null)", () => {
      const slotsForWeek = getAdminSlots(noSlotsStore);
      expect(slotsForWeek).toEqual(emptyWeek);
    });

    test("should get all slots for given week even if passed a non-week-start date", () => {
      const slotsForWeek = getAdminSlots({
        ...testStore,
        app: {
          ...testStore.app,
          calendarDay: testStore.app.calendarDay.plus({ days: 1 }),
        },
      });
      expect(slotsForWeek).toEqual(expectedWeekAdmin);
    });
  });
});
