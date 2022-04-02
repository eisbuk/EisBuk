import { LocalStore } from "@/types/store";

import { getCalendarData } from "../calendar";

import { createTestStore } from "@/__testUtils__/firestore";
import { attendance, slotsByDay } from "../__testData__/attendance";
import { expectedCalendarData } from "../__testData__/calendar";
import { testDate } from "@/__testData__/date";

describe("calendar selector", () => {
  describe("calendar slots", () => {
    test("should return calendar data in correct format", () => {
      const testStore = createTestStore({ data: { slotsByDay, attendance } });
      const res = getCalendarData(testDate)(testStore as LocalStore);
      expect(res).toEqual(expectedCalendarData);
    });
  });
});
