import { OrgSubCollection } from "@eisbuk/shared";

import { getNewStore } from "@/store/createStore";

import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";
import { changeCalendarDate } from "@/store/actions/appActions";

import { getSlotsWithAttendance } from "../attendance";

import {
  attendance,
  attendanceCustomers,
  attendanceSlotsByDay,
  expectedStructByName,
  expectedStructByBookedInterval,
} from "../__testData__/attendance";
import { testDateLuxon } from "@/__testData__/date";
import { compareBookedIntervals, compareCustomerNames } from "@/utils/sort";

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

    test("should get slots for current day (read from store) with customers attendance (sorted by customer name) if such 'sortCustomers' function passed in", () => {
      const res = getSlotsWithAttendance(compareCustomerNames)(
        testStore.getState()
      );
      expect(res).toEqual(expectedStructByName);
    });
    test("should get slots for current day (read from store) with customers attendance (sorted by booked interval) if such 'sortCustomers' function passed in", () => {
      const res = getSlotsWithAttendance(compareBookedIntervals)(
        testStore.getState()
      );
      expect(res).toEqual(expectedStructByBookedInterval);
    });
  });
});
