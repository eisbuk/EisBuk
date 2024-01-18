import { describe, vi, expect, test } from "vitest";
import { DateTime } from "luxon";

import {
  BookingSubCollection,
  Category,
  sanitizeCustomer,
  OrgSubCollection,
  SlotsByDay,
} from "@eisbuk/shared";
import { BookingsCountdownVariant } from "@eisbuk/ui";

import { LocalStore } from "@/types/store";

import { Action } from "@/enums/store";

import { getNewStore } from "@/store/createStore";

import {
  getIsBookingAllowed,
  getCountdownProps,
  getSlotsForCustomer,
} from "../index";

import { changeCalendarDate } from "@/store/actions/appActions";
import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";

import { saul } from "@eisbuk/testing/customers";
import {
  currentMonthStartDate,
  expectedMonthCustomer,
  slotsByDay,
} from "../../__testData__/slots";
import { baseSlot } from "@eisbuk/testing/slots";
import {
  getBookedAndAttendedSlotsForCalendar,
  getBookingsForCalendar,
  getMonthEmptyForBooking,
} from "../slots";

// set date mock to be a consistent date throughout
const mockDate = DateTime.fromISO("2022-02-05");
const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(mockDate.toMillis());

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

  describe("Test 'getCanBook' selector", () => {
    test("should allow admin to book at all times", () => {
      /** @TODO this is flaky */
      // set up test with `isAdmin === true`
      const store = getNewStore();
      store.dispatch({ type: Action.UpdateAdminStatus, payload: true });
      expect(
        getIsBookingAllowed(saul.secretKey, DateTime.now())(store.getState())
      ).toEqual(true);
    });

    test("should allow booking if the booking deadline hasn't passed", () => {
      const store = getNewStore();
      // we're observing February slots (deadline: 26th January)
      const currentDate = mockDate;
      const currentMonthDeadline = currentDate
        .minus({ months: 1 })
        .endOf("month")
        .minus({ days: 5 })
        .endOf("day");
      // create local mock date to be one day before the deadline
      const localMockDate = currentMonthDeadline.minus({ days: 1 });
      dateNowSpy.mockReturnValueOnce(localMockDate.toMillis());
      expect(
        getIsBookingAllowed(saul.secretKey, currentDate)(store.getState())
      ).toEqual(true);
    });

    test("should not allow booking if the booking deadline for the month is passed", () => {
      const store = getNewStore();
      // we're observing February slots (deadline: 26th January)
      const currentDate = mockDate;
      const currentMonthDeadline = currentDate
        .minus({ months: 1 })
        .endOf("month")
        .minus({ days: 5 })
        .endOf("day");
      // create local mock date to be one day after the deadline
      const localMockDate = currentMonthDeadline.plus({ days: 1 });
      dateNowSpy.mockReturnValueOnce(localMockDate.toMillis());
      expect(
        getIsBookingAllowed(saul.secretKey, currentDate)(store.getState())
      ).toEqual(false);
    });

    test("should allow booking if within extended date period", () => {
      const store = getNewStore();
      // we're observing February slots (deadline: 26th January)
      const currentDate = mockDate;
      // create extended date two days from now
      const extendedDateLuxon = currentDate.plus({ days: 2 });
      const extendedDate = extendedDateLuxon.toISODate();
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.Bookings, {
          [saul.secretKey]: sanitizeCustomer({ ...saul, extendedDate }),
        })
      );
      expect(
        getIsBookingAllowed(saul.secretKey, currentDate)(store.getState())
      ).toEqual(true);
    });

    test("should not allow booking if in extended date period, but extended date has passed", () => {
      const store = getNewStore();
      // we're observing February slots (deadline: 26th January)
      const currentDate = mockDate;
      // create already passed extended date
      const extendedDateLuxon = mockDate.minus({ days: 1 });
      const extendedDate = extendedDateLuxon.toISODate();
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.Bookings, {
          [saul.secretKey]: sanitizeCustomer({ ...saul, extendedDate }),
        })
      );
      expect(
        getIsBookingAllowed(saul.secretKey, currentDate)(store.getState())
      ).toEqual(false);
    });

    test("edge case: should not allow booking if extended date exists for future month, but current month deadline has already passed", () => {
      const store = getNewStore();
      // we're observing February slots (deadline: 26th January)
      const currentDate = mockDate;
      // create already passed extended date
      const extendedDateLuxon = mockDate.minus({ days: 1 });
      const extendedDate = extendedDateLuxon.toISODate();
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.Bookings, {
          [saul.secretKey]: sanitizeCustomer({ ...saul, extendedDate }),
        })
      );
      expect(
        getIsBookingAllowed(saul.secretKey, currentDate)(store.getState())
      ).toEqual(false);
    });
  });

  describe("getShouldDisplayCountdown", () => {
    // a date we'll be using as `DateTime.now()` to keep things consistent

    test("should display countdown for currently observed month (based on redux date)", () => {
      const store = getNewStore();
      const currentDate = mockDate.plus({ months: 2 });
      store.dispatch(changeCalendarDate(currentDate));
      const expectedRes = {
        // if not in extended date period, should always show first deadline
        variant: BookingsCountdownVariant.FirstDeadline,
        month: currentDate.startOf("month"),
        deadline: currentDate
          // bookings are locked before the month begins
          .minus({ months: 1 })
          .endOf("month")
          // we're testing for (default) 5 days locking period
          .minus({ days: 5 })
          .endOf("day"),
      };
      expect(getCountdownProps(saul.secretKey)(store.getState())).toEqual(
        expectedRes
      );
    });

    test("should display countdown for second deadline if extended date belongs to observed month", () => {
      const store = getNewStore();
      // use extended date in the observed period
      // use the month of mock date as observed period (February)
      const currentDate = mockDate;
      // we're testing for `extendedDate` which hasn't yet passed
      const extendedDateLuxon = mockDate.plus({ days: 2 }).endOf("day");
      const extendedDate = extendedDateLuxon.toISODate();
      store.dispatch(changeCalendarDate(currentDate));
      // grant (saul) our test customer an extended date for february ("2022-02-07")
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.Bookings, {
          [saul.secretKey]: sanitizeCustomer({ ...saul, extendedDate }),
        })
      );
      const expectedRes = {
        variant: BookingsCountdownVariant.SecondDeadline,
        month: currentDate.startOf("month"),
        deadline: extendedDateLuxon,
      };
      expect(getCountdownProps(saul.secretKey)(store.getState())).toEqual(
        expectedRes
      );
    });

    test("should not display any countdown for admin", () => {
      const store = getNewStore();
      const currentDate = mockDate.plus({ months: 2 });
      store.dispatch(changeCalendarDate(currentDate));
      store.dispatch({ type: Action.UpdateAdminStatus, payload: true });
      expect(getCountdownProps(saul.secretKey)(store.getState())).toEqual(
        undefined
      );
    });

    test("should display bookings are locked message (instead of countdown) if bookings for this period are locked", () => {
      const store = getNewStore();
      // bookings for a current month (the month we're in) should (trivially) be locked
      const currentDate = mockDate;
      store.dispatch(changeCalendarDate(currentDate));
      const expectedRes = {
        variant: BookingsCountdownVariant.BookingsLocked,
        deadline: null,
        month: currentDate.startOf("month"),
      };
      expect(getCountdownProps(saul.secretKey)(store.getState())).toEqual(
        expectedRes
      );
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
