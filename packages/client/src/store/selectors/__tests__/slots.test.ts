import { DateTime } from "luxon";

import { OrgSubCollection } from "@eisbuk/shared";

import { getNewStore } from "@/store/createStore";

import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";
import { changeCalendarDate } from "@/store/actions/appActions";

import { getAdminSlots } from "../slots";

import {
  currentWeekStartDate,
  expectedWeekAdmin,
  emptyWeek,
  slotsByDay,
} from "../__testData__/slots";

const testDate = DateTime.fromISO(currentWeekStartDate);

describe("Slot selectors > ", () => {
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
