import {
  expectedStructByName,
  expectedStructByBookedInterval,
  testStore,
} from "../__testData__/attendance";

import { getSlotsWithAttendance } from "../attendance";
import { AttendanceSortBy } from "@/enums/other";

describe("Selectors ->", () => {
  describe("Test 'getSlotsWithAttendance'", () => {
    test("should get slots for current day (read from store) with customers attendance (sorted by customer name) data for each slot", () => {
      const res = getSlotsWithAttendance()(testStore);
      expect(res).toEqual(expectedStructByName);
    });
    test("should get slots for current day (read from store) with customers attendance (sorted by booked interval) data for each slot", () => {
      const res = getSlotsWithAttendance(AttendanceSortBy.BookedInterval)(
        testStore
      );
      expect(res).toEqual(expectedStructByBookedInterval);
    });
  });
});
