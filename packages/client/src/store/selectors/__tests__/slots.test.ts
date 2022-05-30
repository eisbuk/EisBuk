import { DateTime } from "luxon";

import {
  Category,
  DeprecatedCategory,
  OrgSubCollection,
  SlotsByDay,
} from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

import { getAdminSlots, getSlotsForCustomer } from "../slots";

import { getNewStore } from "@/store/createStore";
import { updateLocalDocuments } from "@/react-redux-firebase/actions";

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
import { baseSlot } from "@/__testData__/slots";

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

    const courseAdultsSlot = {
      ...baseSlot,
      id: "course",
      categories: [Category.CourseAdults],
    };
    const preCompetitiveAdultsSlot = {
      ...baseSlot,
      id: "pre-competitive",
      categories: [Category.PreCompetitiveAdults],
    };
    const adultsSlot = {
      ...baseSlot,
      id: "adults",
      categories: [DeprecatedCategory.Adults],
    };
    const competitiveSlot = {
      ...baseSlot,
      id: "competitive",
      categories: [Category.Competitive],
    };

    /** @TODO_TEST maybe the following tests should test `filterSlotsByCategory` directly */
    test('should display both "pre-competitive-adults" and "course-adults" slots to unsorted "adults" customers', () => {
      const testDate = baseSlot.date;
      const currentMonthString = testDate.substring(0, 7);
      const testStore = getNewStore();
      testStore.dispatch(
        updateLocalDocuments(OrgSubCollection.SlotsByDay, {
          [currentMonthString]: {
            /** @TODO_TESTS hardcoded test date, make this a bit more concise */
            ["2021-03-01"]: {
              [courseAdultsSlot.id]: courseAdultsSlot,
              [preCompetitiveAdultsSlot.id]: preCompetitiveAdultsSlot,
              [competitiveSlot.id]: competitiveSlot,
            },
          },
        } as Record<string, SlotsByDay>)
      );
      // create a selector curried with `timeframe` and `date` params (like we will be doing within the component)
      const selector = getSlotsForCustomer(
        DeprecatedCategory.Adults,
        "week",
        DateTime.fromISO(testDate)
      );
      // test created selector against test store state
      const res = selector(testStore.getState());
      // Should only filter the "competitive" slot
      expect(res).toEqual({
        ["2021-03-01"]: {
          [courseAdultsSlot.id]: courseAdultsSlot,
          [preCompetitiveAdultsSlot.id]: preCompetitiveAdultsSlot,
        },
        ["2021-03-02"]: {},
        ["2021-03-03"]: {},
        ["2021-03-04"]: {},
        ["2021-03-05"]: {},
        ["2021-03-06"]: {},
        ["2021-03-07"]: {},
      });
    });

    test('should display slots with category "adults" to both "pre-competitive-adults" and "course-adults" customers', () => {
      const testDate = baseSlot.date;
      const currentMonthString = testDate.substring(0, 7);
      const testStore = getNewStore();
      testStore.dispatch(
        updateLocalDocuments(OrgSubCollection.SlotsByDay, {
          [currentMonthString]: {
            /** @TODO_TESTS hardcoded test date, make this a bit more concise */
            ["2021-03-01"]: {
              [courseAdultsSlot.id]: courseAdultsSlot,
              [preCompetitiveAdultsSlot.id]: preCompetitiveAdultsSlot,
              [adultsSlot.id]: adultsSlot,
              [competitiveSlot.id]: competitiveSlot,
            },
          },
        } as Record<string, SlotsByDay>)
      );
      // create a selector curried with `timeframe` and `date` params (like we will be doing within the component)
      const selector = getSlotsForCustomer(
        Category.CourseAdults,
        "week",
        DateTime.fromISO(testDate)
      );
      // test created selector against test store state
      const res = selector(testStore.getState());
      // Should filter out the "competitive" and "pre-competitive-adults" slots
      expect(res).toEqual({
        ["2021-03-01"]: {
          [courseAdultsSlot.id]: courseAdultsSlot,
          [adultsSlot.id]: adultsSlot,
        },
        ["2021-03-02"]: {},
        ["2021-03-03"]: {},
        ["2021-03-04"]: {},
        ["2021-03-05"]: {},
        ["2021-03-06"]: {},
        ["2021-03-07"]: {},
      });
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
