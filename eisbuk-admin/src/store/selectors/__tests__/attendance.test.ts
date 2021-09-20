import { expectedStruct, testStore } from "../__testData__/attendance";

import { getSlotsWithAttendance } from "../attendance";

describe("Selectors ->", () => {
  describe("Test 'getSlotsWithAttendance'", () => {
    test("should get slots for current day (read from store) with customers attendance data for each slot", () => {
      const res = getSlotsWithAttendance(testStore);
      expect(res).toEqual(expectedStruct);
    });
  });
});
