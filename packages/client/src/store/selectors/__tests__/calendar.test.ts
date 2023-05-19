import { describe, expect, test } from "vitest";

import { testDate } from "@eisbuk/test-data/date";

import { getNewStore } from "@/store/createStore";

import { getCalendarData } from "../calendar";

import { attendance, attendanceSlotsByDay } from "../__testData__/attendance";

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
      expect(res).toEqual({
        "2021-03-01": "booked",
        "2021-03-02": "hasSlots",
      });
    });
  });
});
