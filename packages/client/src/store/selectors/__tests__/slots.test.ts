import { describe, expect, test } from "vitest";
import { DateTime } from "luxon";

import { getNewStore } from "@/store/createStore";

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
      const store = getNewStore({
        firestore: {
          data: {
            slotsByDay,
          },
        },
        app: {
          calendarDay: testDate,
        },
      });
      const slotsForWeek = getAdminSlots(store.getState());
      expect(slotsForWeek).toEqual(expectedWeekAdmin);
    });

    test("should return empty days if no slots in store ('slotsByDay' = null)", () => {
      const store = getNewStore({
        app: {
          calendarDay: testDate,
        },
      });
      store.dispatch(changeCalendarDate(testDate));
      const slotsForWeek = getAdminSlots(store.getState());
      expect(slotsForWeek).toEqual(emptyWeek);
    });

    test("should get all slots for given week even if passed a non-week-start date", () => {
      const store = getNewStore({
        firestore: {
          data: {
            slotsByDay,
          },
        },
        app: {
          calendarDay: testDate.plus({ days: 1 }),
        },
      });
      const slotsForWeek = getAdminSlots(store.getState());
      expect(slotsForWeek).toEqual(expectedWeekAdmin);
    });
  });
});
