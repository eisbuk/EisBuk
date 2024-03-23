import { describe, expect, test } from "vitest";
import { DateTime } from "luxon";

import {
  BookingSubCollection,
  Category,
  sanitizeCustomer,
  SlotsByDay,
} from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

import { getNewStore } from "@/store/createStore";

import { getSlotsForCustomer } from "../index";

import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";

import { saul } from "@eisbuk/testing/customers";
import {
  currentMonthStartDate,
  expectedMonthCustomer,
  slotsByDay,
} from "@/store/selectors/__testData__/slots";
import { baseSlot } from "@eisbuk/testing/slots";
import {
  getBookedAndAttendedSlotsForCalendar,
  getBookingsForCalendar,
  getMonthEmptyForBooking,
} from "../slots";

const setupBookingsTest = ({
  category,
  date,
  slotsByDay,
  slotBookingsCounts = {},
  bookedSlots = {},
}: {
  category: Category;
  date: DateTime;
  slotsByDay: NonNullable<LocalStore["firestore"]["data"]["slotsByDay"]>;
  slotBookingsCounts?: NonNullable<
    LocalStore["firestore"]["data"]["slotBookingsCounts"]
  >;
  bookedSlots?: NonNullable<LocalStore["firestore"]["data"]["bookedSlots"]>;
}): ReturnType<typeof getNewStore> => {
  const store = getNewStore({
    firestore: {
      data: {
        bookings: {
          [saul.secretKey]: {
            ...sanitizeCustomer(saul),
            categories: [category as Category],
          },
        },
        slotsByDay,
        slotBookingsCounts,
        bookedSlots,
      },
    },
    app: {
      calendarDay: date,
    },
  });

  return store;
};

describe("Selectors ->", () => {
  describe("'getSlotsForCustomer' > ", () => {
    test("should get slots for a month with respect to 'startDate' and provided category", () => {
      const date = DateTime.fromISO(currentMonthStartDate);
      const store = setupBookingsTest({
        category: Category.Competitive,
        slotsByDay,
        date,
      });
      const res = getSlotsForCustomer(saul.secretKey)(store.getState());
      expect(res).toEqual(expectedMonthCustomer);
    });

    test("should filter out slots booked at full capacity", () => {
      const date = DateTime.fromISO("2021-01-01");
      const category = Category.Competitive;

      // For this test case, each slot will have the same category, date and capacity
      const testSlot = {
        ...baseSlot,
        categories: [category],
        date: "2021-01-01",
        capacity: 2,
      };

      // Add a non-full slot to slotsByDay
      const slot1 = { ...testSlot, id: "slot-1" };
      const slot2 = { ...testSlot, id: "slot-2" };
      const slotsByDay = {
        "2021-01": {
          "2021-01-01": { "slot-1": slot1, "slot-2": slot2 },
        },
      };

      // Create slot bookings counts
      const slotBookingsCounts = {
        "2021-01": {
          // Slot 1 still has vacancy
          "slot-1": 1,
          // Slot 2 is fully booked
          "slot-2": 2,
        },
      };

      const store = setupBookingsTest({
        category: Category.Competitive,
        slotsByDay,
        slotBookingsCounts,
        date,
      });
      const res = getSlotsForCustomer(saul.secretKey)(store.getState());
      // Slot 1 should be returned, slot 2 should be filtered out (fully booked)
      expect(res).toEqual({ "2021-01-01": { "slot-1": slot1 } });
    });

    test("should filter out slots booked at full capacity", () => {
      const date = DateTime.fromISO("2021-01-01");
      const category = Category.Competitive;

      // For this test case, each slot will have the same category, date and capacity
      const testSlot = {
        ...baseSlot,
        categories: [category],
        date: "2021-01-01",
        capacity: 2,
      };

      // Add a non-full slot to slotsByDay
      const slot1 = { ...testSlot, id: "slot-1" };
      const slot2 = { ...testSlot, id: "slot-2" };
      const slotsByDay = {
        "2021-01": {
          "2021-01-01": { "slot-1": slot1, "slot-2": slot2 },
        },
      };

      // Create slot bookings counts
      const slotBookingsCounts = {
        "2021-01": {
          // Slot 1 still has vacancy
          "slot-1": 1,
          // Slot 2 is fully booked
          "slot-2": 2,
        },
      };

      // Book slot-2 for the customer
      const bookedSlots = {
        "slot-2": {
          date: "2021-01-01",
          interval: "09:00-10:00",
        },
      };

      const store = setupBookingsTest({
        category: Category.Competitive,
        slotsByDay,
        slotBookingsCounts,
        bookedSlots,
        date,
      });
      const res = getSlotsForCustomer(saul.secretKey)(store.getState());
      // Since slot 2 is booked by the customer, it should be returned (even if at full capacity)
      expect(res).toEqual(slotsByDay["2021-01"]);
    });
  });

  describe("getMonthEmptyForBooking", () => {
    interface TestParams {
      name: string;
      category: Category;
      slotsByDay: SlotsByDay;
      wantRes: boolean;
    }

    const runTableTests = (tests: TestParams[]) =>
      tests.forEach(({ name, category, slotsByDay, wantRes }) =>
        test(name, () => {
          const date = DateTime.fromISO(baseSlot.date);
          const currentMonthString = baseSlot.date.substring(0, 7);
          const store = setupBookingsTest({
            category,
            date,
            slotsByDay: { [currentMonthString]: slotsByDay },
          });
          expect(
            getMonthEmptyForBooking(saul.secretKey)(store.getState())
          ).toEqual(wantRes);
        })
      );

    runTableTests([
      {
        name: "should return true if there are no slots in a month",
        category: Category.Competitive,
        slotsByDay: {},
        wantRes: true,
      },
      {
        name: "should return true if there are slots in a month, but not of the required category",
        category: Category.Competitive,
        slotsByDay: {
          [baseSlot.date]: {
            ["diff-category-slot"]: {
              ...baseSlot,
              categories: [Category.CourseAdults],
            },
          },
        },
        wantRes: true,
      },
      {
        name: "should return false if there are slots available for booking in the required month for the required category",
        category: Category.Competitive,
        slotsByDay: {
          [baseSlot.date]: {
            ["diff-category-slot"]: {
              ...baseSlot,
              categories: [Category.Competitive],
            },
          },
        },
        wantRes: false,
      },
    ]);
  });

  describe("getBookingsForCalendar", () => {
    test("should return a list of booked slots with corresponding booked interval and bookingNotes", () => {
      const monthStr = "2022-01";

      // We're using 3 days, each with one slot
      const days = ["2022-01-01", "2022-01-02", "2022-01-03"];
      const [day1, day2, day3] = days;

      // Construct slots for all 3 days
      const [slot1, bookedSlot, slot3] = Array(3)
        .fill(null)
        .map((_, i) => ({
          ...baseSlot,
          // Results in: slot-1, slot-2, slot-3
          id: `slot-${i + 1}`,
          // All slots should be of required category
          categories: [Category.Competitive],
          date: days[i],
        }));

      const store = setupBookingsTest({
        category: Category.Competitive,
        // Any day from the test month would do
        date: DateTime.fromISO(day3),
        slotsByDay: {
          [monthStr]: {
            [day1]: { [slot1.id]: slot1 },
            [day2]: { [bookedSlot.id]: bookedSlot },
            [day3]: { [slot3.id]: slot3 },
          },
        },
      });

      // Book second slot (`bookedSlot`)
      const bookedIntervalKey = Object.keys(baseSlot.intervals)[0];
      const bookedInterval = baseSlot.intervals[bookedIntervalKey];
      // Should also receive booking notes with the booked slot
      const bookingNotes = "Lock up Nancy Pelosi!";

      store.dispatch(
        updateLocalDocuments(BookingSubCollection.BookedSlots, {
          [bookedSlot.id]: {
            date: bookedSlot.date,
            interval: bookedIntervalKey,
            bookingNotes,
          },
        })
      );
      expect(getBookingsForCalendar(store.getState())).toEqual([
        {
          ...bookedSlot,
          booked: true,
          interval: bookedInterval,
          bookingNotes,
        },
      ]);
    });

    test("should sort the slots (by date, and by time intraday)", () => {
      const monthStr = "2022-01";
      const date = "2022-01-01";
      const tomorrow = "2022-01-02";

      const intervals = {
        "09:00-10:00": {
          startTime: "09:00",
          endTime: "10:00",
        },
        "10:00-11:00": {
          startTime: "10:00",
          endTime: "11:00",
        },
        "11:00-12:00": {
          startTime: "11:00",
          endTime: "12:00",
        },
      };

      const [slot1, slot2, slot3, slot4] = [
        {
          ...baseSlot,
          id: "slot-1",
          intervals,
          date,
          categories: [Category.Competitive],
        },
        {
          ...baseSlot,
          id: "slot-2",
          intervals,
          date,
          categories: [Category.Competitive],
        },
        {
          ...baseSlot,
          id: "slot-3",
          intervals,
          date,
          categories: [Category.Competitive],
        },
        {
          ...baseSlot,
          id: "slot-4",
          intervals,
          date: tomorrow,
          categories: [Category.Competitive],
        },
      ];

      const store = setupBookingsTest({
        category: Category.Competitive,
        // Any day from the test month would do
        date: DateTime.fromISO(date),
        slotsByDay: {
          [monthStr]: {
            // We're adding slots in an arbitrary order to intrduce additional entropy before sorting
            [date]: { [slot3.id]: slot3, [slot2.id]: slot2, [slot1.id]: slot1 },
            [tomorrow]: { [slot4.id]: slot4 },
          },
        },
      });

      store.dispatch(
        // We're booking the slots in the same order as they appear in the store,
        // this should fail the test unless the fix (tested by this) is not in place.
        updateLocalDocuments(BookingSubCollection.BookedSlots, {
          [slot3.id]: {
            date: slot3.date,
            // Last interval (should appear last of all the slots in the day)
            interval: "11:00-12:00",
          },
          [slot1.id]: {
            date: slot1.date,
            // First interval (should appear first, regardless of the order it's been added)
            interval: "09:00-10:00",
          },
          [slot4.id]: {
            date: slot4.date,
            // Regerdless of this not being the last interval, this slot should appear last as the date sorting takes precenence
            interval: "09:00-10:00",
          },
        })
      );
      // Second slot should be attended, not booked to verify that the final result sorts all results, regerdless of the booked state
      store.dispatch(
        updateLocalDocuments(BookingSubCollection.AttendedSlots, {
          [slot2.id]: {
            date: slot2.date,
            // Second interval (we want this slot to appear 2nd - be merged with the booked slots, and then sorted)
            interval: "10:00-11:00",
          },
        })
      );

      // It's enough to just check that the ids appear in the desired order
      const ids = getBookedAndAttendedSlotsForCalendar(store.getState()).map(
        ({ id }) => id
      );
      expect(ids).toEqual(["slot-1", "slot-2", "slot-3", "slot-4"]);
    });
  });
});
