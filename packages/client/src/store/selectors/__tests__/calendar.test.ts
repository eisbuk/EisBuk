import { getNewStore } from "@/store/createStore";

import { getCalendarData } from "../calendar";

import { attendance, attendanceSlotsByDay } from "../__testData__/attendance";
import { expectedCalendarData } from "../__testData__/calendar";
import { testDate } from "@/__testData__/date";

describe("calendar selector", () => {
  describe("calendar slots", () => {
    test("should return calendar data in correct format", () => {
      const store = getNewStore({
        firestore: {
          data: {
            slotsByDay: attendanceSlotsByDay,
            attendance,
          },
        },
      });
      const res = getCalendarData(testDate)(store.getState());
      expect(res).toEqual(expectedCalendarData);
    });
  });
});
