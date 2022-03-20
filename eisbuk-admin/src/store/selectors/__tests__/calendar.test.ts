import { LocalStore } from "@/types/store";

import { getCalendarData } from "../calendar";

import { createTestStore } from "@/__testUtils__/firestore";
import { slotsByDay } from "../__testData__/slots";
import { attendance } from "../__testData__/attendance";
import { expectedCalendarData } from "../__testData__/calendar";

describe("calendar selector", () => {
  describe("calendar slots", () => {
    test("should return calendar data in correct format", () => {
      const testStore = createTestStore({ data: { slotsByDay, attendance } });
      const res = getCalendarData(testStore as LocalStore);
      expect(res).toEqual(expectedCalendarData);
    });
  });
});
