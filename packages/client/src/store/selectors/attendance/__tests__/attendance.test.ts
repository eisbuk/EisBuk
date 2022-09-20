import { OrgSubCollection } from "@eisbuk/shared";

import { getNewStore } from "@/store/createStore";

import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";
import { changeCalendarDate } from "@/store/actions/appActions";

import { getSlotsWithAttendance } from "../slotAttendance";
import {
  collectAttendanceByCustomer,
  filterAttendanceByMonth,
  flattenAndConvertAttendanceIntervals,
  formatToTableData,
} from "../attendanceVariance";

import {
  attendance,
  attendanceCustomers,
  attendanceSlotsByDay,
  expectedStruct,
} from "../../__testData__/attendance";
import { testDate, testDateLuxon } from "@/__testData__/date";
import { walt, jian, saul } from "@/__testData__/customers";

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

    test("should get slots for current day (read from store) with customers attendance (sorted by booked interval) data for each slot", () => {
      const res = getSlotsWithAttendance(testStore.getState());
      expect(res).toEqual(expectedStruct);
    });
  });

  describe("Test 'getMonthAttendanceVariance'", () => {
    const attendanceArr = Object.values(attendance!);

    test("should filter attendance collection by date", () => {
      const currentMonthStr = testDateLuxon.toISODate().substring(0, 7);
      const nextMonthStr = testDateLuxon
        .plus({ month: 1 })
        .toISODate()
        .substring(0, 7);

      const currentMonthFilter = filterAttendanceByMonth(currentMonthStr);
      const nextMonthFilter = filterAttendanceByMonth(nextMonthStr);

      const currentMonth = attendanceArr.filter(currentMonthFilter);
      const nextMonth = attendanceArr.filter(nextMonthFilter);

      // __testsData__/attendance => line 70 tests attendance records
      expect(currentMonth.length).toBe(7);
      expect(nextMonth.length).toBe(0);
    });

    test("should flatten SlotAttendance docs & convert interval stringss to numbers", () => {
      const [singleSlotAttendanceDoc] = attendanceArr;

      const [result] = [singleSlotAttendanceDoc].reduce(
        flattenAndConvertAttendanceIntervals,
        []
      );

      expect(result).toHaveProperty("date");
      expect(result).toHaveProperty("customerId");
      expect(typeof result.attendedInterval).toBe("number");
      expect(typeof result.bookedInterval).toBe("number");
    });

    test("should collect attendance by customer", () => {
      // * Working only with "slot-0", and "slot-1" of /__testsData__/attendance => line 70 tests attendance records
      const [attendanceDoc1, attendanceDoc2] = attendanceArr;

      const flatAttendanceRecords = [attendanceDoc1, attendanceDoc2].reduce(
        flattenAndConvertAttendanceIntervals,
        []
      );

      const result = flatAttendanceRecords.reduce(
        collectAttendanceByCustomer,
        {}
      );

      expect(result).toHaveProperty(walt.id);
      expect(result).toHaveProperty(jian.id);
      expect(result).toHaveProperty(saul.id);

      const jiansAttendanceRecords = result[jian.id];
      expect(jiansAttendanceRecords.length).toBe(2);
    });

    test("should format CustomerAttendanceRecords to TableData entries", () => {
      // * Working only with "slot-0", and "slot-1" of /__testsData__/attendance => line 70 tests attendance records
      const [attendanceDoc1, attendanceDoc2] = attendanceArr;

      const customerAttendance = [attendanceDoc1, attendanceDoc2]
        .reduce(flattenAndConvertAttendanceIntervals, [])
        .reduce(collectAttendanceByCustomer, {});

      const result = Object.entries(customerAttendance).map(
        formatToTableData(attendanceCustomers)
      );

      const [firstEntry, secondEntry, thirdEntry] = result;

      expect(result.length).toBe(3);
      expect(firstEntry).toHaveProperty("athlete");
      expect(firstEntry.hours).toHaveProperty(testDate);

      // testDate attendance hours should now be collected as tuple: [booked, attended]
      expect(firstEntry.hours[testDate]).toHaveLength(2);
      expect(secondEntry.hours[testDate]).toHaveLength(2);
      expect(thirdEntry.hours[testDate]).toHaveLength(2);
    });
  });
});
