import { OrgSubCollection } from "@eisbuk/shared";

import { getNewStore } from "@/store/createStore";

import { updateLocalDocuments } from "@/react-redux-firebase/actions";
import { changeCalendarDate } from "@/store/actions/appActions";

import { getSlotsWithAttendance } from "../attendance";
import { AttendanceSortBy } from "@/enums/other";

import {
  attendance,
  attendanceCustomers,
  attendanceSlotsByDay,
  expectedStructByName,
  expectedStructByBookedInterval,
} from "../__testData__/attendance";
import { testDateLuxon } from "@/__testData__/date";

describe("Selectors ->", () => {
  describe("Test 'getSlotsWithAttendance'", () => {
    const testStore = getNewStore();
    testStore.dispatch(changeCalendarDate(testDateLuxon));
    testStore.dispatch(
      updateLocalDocuments(OrgSubCollection.Attendance, attendance!)
    );
    testStore.dispatch(
      updateLocalDocuments(OrgSubCollection.Customers, attendanceCustomers)
    );
    testStore.dispatch(
      updateLocalDocuments(OrgSubCollection.SlotsByDay, attendanceSlotsByDay!)
    );

    test("should get slots for current day (read from store) with customers attendance (sorted by customer name) data for each slot", () => {
      const res = getSlotsWithAttendance()(testStore.getState());
      expect(res).toEqual(expectedStructByName);
    });
    test("should get slots for current day (read from store) with customers attendance (sorted by booked interval) data for each slot", () => {
      const res = getSlotsWithAttendance(AttendanceSortBy.BookedInterval)(
        testStore.getState()
      );
      expect(res).toEqual(expectedStructByBookedInterval);
    });
  });
});
