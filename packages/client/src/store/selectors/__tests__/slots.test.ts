import { DateTime } from "luxon";

import {
  Category,
  DeprecatedCategory,
  getCustomerBase,
  OrgSubCollection,
} from "@eisbuk/shared";

import { getNewStore } from "@/store/createStore";

import { updateLocalDocuments } from "@/react-redux-firebase/actions";
import { changeCalendarDate } from "@/store/actions/appActions";

import { getAdminSlots, getSlotsForCustomer } from "../slots";

import {
  currentWeekStartDate,
  currentMonthStartDate,
  expectedWeekAdmin,
  emptyWeek,
  expectedMonthCustomer,
  slotsByDay,
} from "../__testData__/slots";
import { baseSlot } from "@/__testData__/slots";
import { LocalStore } from "@/types/store";
import { saul } from "@/__testData__/customers";

const testDate = DateTime.fromISO(currentWeekStartDate);

const setupSelectorTests = ({
  category,
  date,
  slotsByDay,
}: {
  category: Category | DeprecatedCategory;
  date: DateTime;
  slotsByDay: NonNullable<LocalStore["firestore"]["data"]["slotsByDay"]>;
}): ReturnType<typeof getNewStore> => {
  const store = getNewStore();

  store.dispatch(changeCalendarDate(date));
  store.dispatch(
    updateLocalDocuments(OrgSubCollection.Bookings, {
      [saul.secretKey]: {
        ...getCustomerBase(saul),
        category,
      },
    })
  );
  store.dispatch(updateLocalDocuments(OrgSubCollection.SlotsByDay, slotsByDay));

  return store;
};

describe("Slot selectors > ", () => {
  describe("'getSlotsForCustomer' > ", () => {
    test("should get slots for a month with respect to 'startDate' and provided category", () => {
      const date = DateTime.fromISO(currentMonthStartDate);
      const store = setupSelectorTests({
        category: Category.Competitive,
        slotsByDay,
        date,
      });
      const res = getSlotsForCustomer(store.getState());
      expect(res).toEqual(expectedMonthCustomer);
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
      categories: [DeprecatedCategory.Adults as unknown as Category],
    };
    const competitiveSlot = {
      ...baseSlot,
      id: "competitive",
      categories: [Category.Competitive],
    };

    test('should display both "pre-competitive-adults" and "course-adults" slots to unsorted "adults" customers', () => {
      const date = DateTime.fromISO(baseSlot.date);
      const currentMonthString = baseSlot.date.substring(0, 7);
      const store = setupSelectorTests({
        category: DeprecatedCategory.Adults,
        date,
        slotsByDay: {
          [currentMonthString]: {
            ["2021-03-01"]: {
              [courseAdultsSlot.id]: courseAdultsSlot,
              [preCompetitiveAdultsSlot.id]: preCompetitiveAdultsSlot,
              [competitiveSlot.id]: competitiveSlot,
            },
          },
        },
      });
      const res = getSlotsForCustomer(store.getState());
      // Should only filter the "competitive" slot
      expect(res).toEqual({
        ["2021-03-01"]: {
          [courseAdultsSlot.id]: courseAdultsSlot,
          [preCompetitiveAdultsSlot.id]: preCompetitiveAdultsSlot,
        },
      });
    });

    test('should display slots with category "adults" to both "pre-competitive-adults" and "course-adults" customers', () => {
      const date = DateTime.fromISO(baseSlot.date);
      const currentMonthString = baseSlot.date.substring(0, 7);
      const store = setupSelectorTests({
        category: Category.CourseAdults,
        date,
        slotsByDay: {
          [currentMonthString]: {
            /** @TODO_TESTS hardcoded test date, make this a bit more concise */
            ["2021-03-01"]: {
              [courseAdultsSlot.id]: courseAdultsSlot,
              [preCompetitiveAdultsSlot.id]: preCompetitiveAdultsSlot,
              [adultsSlot.id]: adultsSlot,
              [competitiveSlot.id]: competitiveSlot,
            },
          },
        },
      });
      const res = getSlotsForCustomer(store.getState());
      expect(res).toEqual({
        ["2021-03-01"]: {
          [courseAdultsSlot.id]: courseAdultsSlot,
          [adultsSlot.id]: adultsSlot,
        },
      });
    });
  });

  describe("Test 'getAdminSlots' selector", () => {
    test("should get all slots for given week", () => {
      const store = getNewStore();
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.SlotsByDay, slotsByDay!)
      );
      store.dispatch(changeCalendarDate(testDate));
      const slotsForWeek = getAdminSlots(store.getState());
      expect(slotsForWeek).toEqual(expectedWeekAdmin);
    });

    test("should return empty days if no slots in store ('slotsByDay' = null)", () => {
      const store = getNewStore();
      store.dispatch(changeCalendarDate(testDate));
      const slotsForWeek = getAdminSlots(store.getState());
      expect(slotsForWeek).toEqual(emptyWeek);
    });

    test("should get all slots for given week even if passed a non-week-start date", () => {
      const store = getNewStore();
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.SlotsByDay, slotsByDay!)
      );
      store.dispatch(changeCalendarDate(testDate.plus({ days: 1 })));
      const slotsForWeek = getAdminSlots(store.getState());
      expect(slotsForWeek).toEqual(expectedWeekAdmin);
    });
  });
});
