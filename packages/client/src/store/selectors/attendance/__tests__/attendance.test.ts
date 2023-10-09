import { describe, expect, test } from "vitest";

import { testDateLuxon } from "@eisbuk/testing/date";
import { jian, saul, gus } from "@eisbuk/testing/customers";

import { getSlotsWithAttendance } from "../slotAttendance";
import { processAttendances } from "../attendanceVariance";

import { getNewStore } from "@/store/createStore";

import {
  attendance,
  attendanceCustomers,
  attendanceSlotsByDay,
  expectedStruct,
} from "../../__testData__/attendance";
import { LocalStore } from "@/types/store";

type Attendance = NonNullable<LocalStore["firestore"]["data"]["attendance"]>;

describe("Selectors ->", () => {
  describe("Test 'getSlotsWithAttendance'", () => {
    const testStore = getNewStore({
      firestore: {
        data: {
          attendance,
          customers: attendanceCustomers,
          slotsByDay: attendanceSlotsByDay,
        },
      },
      app: {
        calendarDay: testDateLuxon,
      },
    });

    test("should get slots for current day (read from store) with customers attendance (sorted by booked interval) data for each slot", () => {
      const res = getSlotsWithAttendance(testStore.getState());
      expect(res).toEqual(expectedStruct);
    });
  });

  test("Test 'getMonthAttendanceVariance'", () => {
    const attendances: Attendance = {
      // Previous month: should not end up in the final result
      "slot-1": {
        date: "2022-02-01",
        attendances: {
          [jian.id]: {
            bookedInterval: "09:00-11:00",
            attendedInterval: null,
          },
          [saul.id]: {
            bookedInterval: "09:00-11:00",
            attendedInterval: "09:00-11:00",
          },
        },
      },

      "slot-2": {
        date: "2022-03-01",
        attendances: {
          [saul.id]: {
            bookedInterval: null,
            attendedInterval: "09:00-11:00",
          },
        },
      },
      // Current month: should end up in the final result
      // Belongs to the same day as slot-2, saul's attendance should be aggregated here
      "slot-3": {
        date: "2022-03-01",
        attendances: {
          [jian.id]: {
            bookedInterval: "18:00-20:00",
            attendedInterval: null,
          },
          [saul.id]: {
            bookedInterval: "18:00-20:00",
            attendedInterval: "18:00-20:00",
          },
        },
      },
      "slot-4": {
        date: "2022-03-02",
        attendances: {
          // Gus should appear first in the results (as his name is alphabetically first of the three)
          [gus.id]: {
            bookedInterval: "09:00-11:00",
            attendedInterval: "09:00-11:00",
          },
          [saul.id]: {
            bookedInterval: "09:00-11:00",
            attendedInterval: "09:00-11:00",
          },
        },
      },
    };

    const customers = { jian, saul, gus };
    const currentMonth = "2022-03";

    const res = processAttendances(attendances, customers, currentMonth);

    // Three customers
    expect(res.length).toEqual(3);

    // Ordered by customer surname (alphabetically)
    //
    // Fring
    expect(res[0][0]).toEqual(`${gus.name} ${gus.surname}`);
    expect([...res[0][1]]).toEqual([
      ["2022-03-02", { booked: 2, attended: 2 }],
    ]);

    // Goodman
    expect(res[1][0]).toEqual(`${saul.name} ${saul.surname}`);
    expect([...res[1][1]]).toEqual([
      ["2022-03-01", { booked: 2, attended: 4 }],
      ["2022-03-02", { booked: 2, attended: 2 }],
    ]);

    // Yang
    expect(res[2][0]).toEqual(`${jian.name} ${jian.surname}`);
    expect([...res[2][1]]).toEqual([
      ["2022-03-01", { booked: 2, attended: 0 }],
    ]);
  });
});
