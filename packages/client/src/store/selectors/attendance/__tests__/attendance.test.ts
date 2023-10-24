import { describe, expect, test } from "vitest";

import { SlotType, SlotsById } from "@eisbuk/shared";

import { testDateLuxon } from "@eisbuk/testing/date";
import { jian, saul, gus } from "@eisbuk/testing/customers";
import { baseSlot } from "@eisbuk/testing/slots";

import {
  getSlotAttendance,
  getSlotsWithAttendance,
  getBookedIntervalsCustomers,
} from "../slotAttendance";

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

  describe("Test 'getSlotAttendance'", () => {
    const testStore = getNewStore({
      firestore: {
        data: {
          attendance,
        },
      },
    });

    test("should handle missing 'slotId' in attendance", () => {
      const res = getSlotAttendance("slot-non-existent")(testStore.getState());
      expect(res).toEqual({});
    });
    test("should return attendance for 'slotId'", () => {
      const res = getSlotAttendance("slot-0")(testStore.getState());
      const sattendanceForSlots = {
        walt: { bookedInterval: null, attendedInterval: "09:00-10:00" },
        jian: {
          bookedInterval: "09:00-10:00",
          attendedInterval: "09:00-10:00",
        },
        saul: {
          bookedInterval: "10:00-11:00",
          attendedInterval: "09:00-10:00",
        },
      };
      expect(res).toEqual(sattendanceForSlots);
    });
  });

  test("Test 'getMonthAttendanceVariance'", () => {
    const slots = {
      "slot-2": {
        ...baseSlot,
        date: "2022-03-01",
        type: SlotType.Ice,
      },
      "slot-3": {
        ...baseSlot,
        date: "2022-03-01",
        type: SlotType.Ice,
        intervals: {
          "18:00-20:00": {
            startTime: "18:00",
            endTime: "20:00",
          },
        },
      },
      "slot-4": {
        ...baseSlot,
        date: "2022-03-02",
        type: SlotType.OffIce,
      },
      "slot-5": {
        ...baseSlot,
        date: "2022-03-02",
        type: SlotType.Ice,
      },
    } as SlotsById;

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

      // Ice
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
      //
      // Ice
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

      // Off Ice
      "slot-4": {
        date: "2022-03-02",
        attendances: {
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

      // Ice
      "slot-5": {
        date: "2022-03-02",
        attendances: {
          // The attendance shouldn't get accumulated for gus for the day as one slot is ice, whereas other is off-ice
          [gus.id]: {
            bookedInterval: "09:00-11:00",
            attendedInterval: "09:00-11:00",
          },
        },
      },
    };

    const customers = { jian, saul, gus };
    const currentMonth = "2022-03";

    const res = processAttendances(attendances, slots, customers, currentMonth);

    // Three customers
    expect(res.length).toEqual(3);

    // Ordered by customer surname (alphabetically)
    //
    // Fring
    expect(res[0][0]).toEqual(`${gus.name} ${gus.surname}`);
    expect([...res[0][1]]).toEqual([
      [
        "2022-03-02",
        {
          [SlotType.Ice]: { booked: 2, attended: 2 },
          [SlotType.OffIce]: { booked: 2, attended: 2 },
        },
      ],
    ]);

    // Goodman
    expect(res[1][0]).toEqual(`${saul.name} ${saul.surname}`);
    expect([...res[1][1]]).toEqual([
      [
        "2022-03-01",
        {
          [SlotType.Ice]: { booked: 2, attended: 4 },
          [SlotType.OffIce]: { booked: 0, attended: 0 },
        },
      ],
      [
        "2022-03-02",
        {
          [SlotType.Ice]: { booked: 0, attended: 0 },
          [SlotType.OffIce]: { booked: 2, attended: 2 },
        },
      ],
    ]);

    // Yang
    expect(res[2][0]).toEqual(`${jian.name} ${jian.surname}`);
    expect([...res[2][1]]).toEqual([
      [
        "2022-03-01",
        {
          [SlotType.Ice]: { booked: 2, attended: 0 },
          [SlotType.OffIce]: { booked: 0, attended: 0 },
        },
      ],
    ]);
  });

  describe("Test 'getBookedIntervalsCustomers'", () => {
    const testStore = getNewStore({
      firestore: {
        data: {
          attendance,
          customers: attendanceCustomers,
        },
      },
    });

    test("should return list of intervals as keys with customer names as value", () => {
      const res = getBookedIntervalsCustomers("slot-0")(testStore.getState());
      expect(res).toEqual({
        "09:00-10:00": ["Jian Yang"],
        "10:00-11:00": ["Saul Goodman"],
      });
    });
  });
});
