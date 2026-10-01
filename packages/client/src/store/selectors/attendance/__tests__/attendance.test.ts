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

import {
  processAttendances,
  getMonthAttendanceVariance,
  getMonthAttendanceUnresolved,
} from "../attendanceVariance";

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

    test("should not crash when a slot has no attendance doc (regression: #832, missing/lagging attendance trigger)", () => {
      const dateISO = testDateLuxon.toISODate();
      const monthStr = dateISO.substring(0, 7);
      const slot = {
        ...baseSlot,
        id: "slot-without-attendance",
        date: dateISO,
      };

      const store = getNewStore({
        firestore: {
          data: {
            // Slot exists for the current day...
            slotsByDay: { [monthStr]: { [dateISO]: { [slot.id]: slot } } },
            // ...but there's no attendance/{slotId} doc for it.
            attendance: {},
            customers: {},
          },
        },
        app: {
          calendarDay: testDateLuxon,
        },
      });

      expect(() => getSlotsWithAttendance(store.getState())).not.toThrow();
      const res = getSlotsWithAttendance(store.getState());
      expect(res).toHaveLength(1);
      expect(res[0].customers).toEqual([]);
    });

    test("should not crash, nor drop the entry, when an attendance entry references a customer missing from the store (regression: #832)", () => {
      const dateISO = testDateLuxon.toISODate();
      const monthStr = dateISO.substring(0, 7);
      const slot = { ...baseSlot, id: "slot-0", date: dateISO };

      const store = getNewStore({
        firestore: {
          data: {
            slotsByDay: { [monthStr]: { [dateISO]: { [slot.id]: slot } } },
            attendance: {
              [slot.id]: {
                date: dateISO,
                attendances: {
                  [saul.id]: {
                    bookedInterval: "09:00-10:00",
                    attendedInterval: null,
                  },
                  // Customer not (yet) in the store
                  "missing-customer": {
                    bookedInterval: "09:00-10:00",
                    attendedInterval: null,
                  },
                },
              },
            },
            customers: { [saul.id]: saul },
          },
        },
        app: {
          calendarDay: testDateLuxon,
        },
      });

      expect(() => getSlotsWithAttendance(store.getState())).not.toThrow();
      const [{ customers }] = getSlotsWithAttendance(store.getState());
      expect(customers).toHaveLength(2);
      expect(customers).toContainEqual({
        bookedInterval: "09:00-10:00",
        attendedInterval: null,
      });
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
    expect(res[0][0]).toEqual(`${gus.surname} ${gus.name}`);
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
    expect(res[1][0]).toEqual(`${saul.surname} ${saul.name}`);
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
    expect(res[2][0]).toEqual(`${jian.surname} ${jian.name}`);
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

  test("'getMonthAttendanceVariance' should not crash when the month has no slotsByDay entry (regression: #832 / Object.values(undefined))", () => {
    const store = getNewStore({
      firestore: {
        data: {
          attendance: {},
          customers: {},
          // No entry for the viewed month (not loaded yet, or no slots).
          slotsByDay: {},
        },
      },
      app: {
        calendarDay: testDateLuxon,
      },
    });

    expect(() => getMonthAttendanceVariance(store.getState())).not.toThrow();
    expect(getMonthAttendanceVariance(store.getState())).toEqual([]);
  });

  describe("'getMonthAttendanceVariance' with incomplete store data (#843)", () => {
    const dateISO = testDateLuxon.toISODate();
    const monthStr = dateISO.substring(0, 7);
    const loadedSlot = {
      ...baseSlot,
      id: "loaded-slot",
      date: dateISO,
      type: SlotType.Ice,
    };
    const attendance: Attendance = {
      [loadedSlot.id]: {
        date: dateISO,
        attendances: {
          [saul.id]: {
            bookedInterval: "09:00-10:00",
            attendedInterval: "09:00-10:00",
          },
        },
      },
      // Attendance doc for a slot not (yet) present in slotsByDay
      "not-loaded-slot": {
        date: dateISO,
        attendances: {
          [saul.id]: {
            bookedInterval: "18:00-20:00",
            attendedInterval: "18:00-20:00",
          },
        },
      },
    };

    test("should not crash when attendance arrives before the month's slotsByDay doc, and report the entries it can't place", () => {
      const store = getNewStore({
        firestore: {
          data: {
            attendance,
            customers: { [saul.id]: saul },
            // The month's slotsByDay doc hasn't arrived yet
            slotsByDay: {},
          },
        },
        app: { calendarDay: testDateLuxon },
      });

      expect(() => getMonthAttendanceVariance(store.getState())).not.toThrow();
      expect(getMonthAttendanceUnresolved(store.getState())).toEqual([
        { slotId: loadedSlot.id, customerId: saul.id, date: dateISO },
        { slotId: "not-loaded-slot", customerId: saul.id, date: dateISO },
      ]);
    });

    test("should show the entries it can place and report (not silently drop) those referencing a slot missing from slotsByDay", () => {
      const store = getNewStore({
        firestore: {
          data: {
            attendance,
            customers: { [saul.id]: saul },
            slotsByDay: {
              [monthStr]: { [dateISO]: { [loadedSlot.id]: loadedSlot } },
            },
          },
        },
        app: { calendarDay: testDateLuxon },
      });

      const res = getMonthAttendanceVariance(store.getState());
      expect(res.length).toEqual(1);
      expect(res[0][0]).toEqual(`${saul.surname} ${saul.name}`);
      expect([...res[0][1]]).toEqual([
        [
          dateISO,
          {
            [SlotType.Ice]: { booked: 1, attended: 1 },
            [SlotType.OffIce]: { booked: 0, attended: 0 },
          },
        ],
      ]);
      expect(getMonthAttendanceUnresolved(store.getState())).toEqual([
        { slotId: "not-loaded-slot", customerId: saul.id, date: dateISO },
      ]);
    });

    test("should not crash when an attendance entry references an athlete missing from the store, and report it", () => {
      const store = getNewStore({
        firestore: {
          data: {
            attendance: { [loadedSlot.id]: attendance[loadedSlot.id] },
            // Customers not loaded yet
            customers: {},
            slotsByDay: {
              [monthStr]: { [dateISO]: { [loadedSlot.id]: loadedSlot } },
            },
          },
        },
        app: { calendarDay: testDateLuxon },
      });

      expect(() => getMonthAttendanceVariance(store.getState())).not.toThrow();
      expect(getMonthAttendanceVariance(store.getState())).toEqual([]);
      expect(getMonthAttendanceUnresolved(store.getState())).toEqual([
        { slotId: loadedSlot.id, customerId: saul.id, date: dateISO },
      ]);
    });

    test("should report nothing when all data is loaded", () => {
      const store = getNewStore({
        firestore: {
          data: {
            attendance: { [loadedSlot.id]: attendance[loadedSlot.id] },
            customers: { [saul.id]: saul },
            slotsByDay: {
              [monthStr]: { [dateISO]: { [loadedSlot.id]: loadedSlot } },
            },
          },
        },
        app: { calendarDay: testDateLuxon },
      });

      expect(getMonthAttendanceVariance(store.getState()).length).toEqual(1);
      expect(getMonthAttendanceUnresolved(store.getState())).toEqual([]);
    });
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
