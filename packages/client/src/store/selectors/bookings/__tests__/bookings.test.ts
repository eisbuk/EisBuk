import { DateTime } from "luxon";

import {
  BookingSubCollection,
  Category,
  DeprecatedCategory,
  getCustomerBase,
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

import { saul } from "@/__testData__/customers";
import {
  currentMonthStartDate,
  expectedMonthCustomer,
  slotsByDay,
} from "../../__testData__/slots";
import { baseSlot } from "@/__testData__/slots";
import { getBookingsForCalendar, getMonthEmptyForBooking } from "../slots";

// set date mock to be a consistent date throughout
const mockDate = DateTime.fromISO("2022-02-05");
const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(mockDate.toMillis());

const setupBookingsTest = ({
  category,
  date,
  slotsByDay,
}: {
  category: Category | DeprecatedCategory;
  date: DateTime;
  slotsByDay: NonNullable<LocalStore["firestore"]["data"]["slotsByDay"]>;
}): ReturnType<typeof getNewStore> => {
  const store = getNewStore();

  store.dispatch(changeCalendarDate(date));
  store.dispatch(
    updateLocalDocuments(OrgSubCollection.Bookings, {
      [saul.secretKey]: {
        ...getCustomerBase(saul),
        category,
      },
    })
  );
  store.dispatch(updateLocalDocuments(OrgSubCollection.SlotsByDay, slotsByDay));

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
      const res = getSlotsForCustomer(store.getState());
      expect(res).toEqual(expectedMonthCustomer);
    });

    const courseAdultsSlot = {
      ...baseSlot,
      id: "course",
      categories: [Category.CourseAdults],
    };
    const preCompetitiveAdultsSlot = {
      ...baseSlot,
      id: "pre-competitive",
      categories: [Category.PreCompetitiveAdults],
    };
    const adultsSlot = {
      ...baseSlot,
      id: "adults",
      categories: [DeprecatedCategory.Adults as unknown as Category],
    };
    const competitiveSlot = {
      ...baseSlot,
      id: "competitive",
      categories: [Category.Competitive],
    };

    test('should display both "pre-competitive-adults" and "course-adults" slots to unsorted "adults" customers', () => {
      const date = DateTime.fromISO(baseSlot.date);
      const currentMonthString = baseSlot.date.substring(0, 7);
      const store = setupBookingsTest({
        category: DeprecatedCategory.Adults,
        date,
        slotsByDay: {
          [currentMonthString]: {
            ["2021-03-01"]: {
              [courseAdultsSlot.id]: courseAdultsSlot,
              [preCompetitiveAdultsSlot.id]: preCompetitiveAdultsSlot,
              [competitiveSlot.id]: competitiveSlot,
            },
          },
        },
      });
      const res = getSlotsForCustomer(store.getState());
      // Should only filter the "competitive" slot
      expect(res).toEqual({
        ["2021-03-01"]: {
          [courseAdultsSlot.id]: courseAdultsSlot,
          [preCompetitiveAdultsSlot.id]: preCompetitiveAdultsSlot,
        },
      });
    });

    test('should display slots with category "adults" to both "pre-competitive-adults" and "course-adults" customers', () => {
      const date = DateTime.fromISO(baseSlot.date);
      const currentMonthString = baseSlot.date.substring(0, 7);
      const store = setupBookingsTest({
        category: Category.CourseAdults,
        date,
        slotsByDay: {
          [currentMonthString]: {
            /** @TODO_TESTS hardcoded test date, make this a bit more concise */
            ["2021-03-01"]: {
              [courseAdultsSlot.id]: courseAdultsSlot,
              [preCompetitiveAdultsSlot.id]: preCompetitiveAdultsSlot,
              [adultsSlot.id]: adultsSlot,
              [competitiveSlot.id]: competitiveSlot,
            },
          },
        },
      });
      const res = getSlotsForCustomer(store.getState());
      expect(res).toEqual({
        ["2021-03-01"]: {
          [courseAdultsSlot.id]: courseAdultsSlot,
          [adultsSlot.id]: adultsSlot,
        },
      });
    });
  });

  describe("Test 'getCanBook' selector", () => {
    test("should allow admin to book at all times", () => {
      /** @TODO this is flaky */
      // set up test with `isAdmin === true`
      const store = getNewStore();
      store.dispatch({ type: Action.UpdateAdminStatus, payload: true });
      expect(getIsBookingAllowed(DateTime.now())(store.getState())).toEqual(
        true
      );
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
      expect(getIsBookingAllowed(currentDate)(store.getState())).toEqual(true);
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
      expect(getIsBookingAllowed(currentDate)(store.getState())).toEqual(false);
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
          [saul.secretKey]: getCustomerBase({ ...saul, extendedDate }),
        })
      );
      expect(getIsBookingAllowed(currentDate)(store.getState())).toEqual(true);
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
          [saul.secretKey]: getCustomerBase({ ...saul, extendedDate }),
        })
      );
      expect(getIsBookingAllowed(currentDate)(store.getState())).toEqual(false);
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
          [saul.secretKey]: getCustomerBase({ ...saul, extendedDate }),
        })
      );
      expect(getIsBookingAllowed(currentDate)(store.getState())).toEqual(false);
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
      expect(getCountdownProps(store.getState())).toEqual(expectedRes);
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
          [saul.secretKey]: getCustomerBase({ ...saul, extendedDate }),
        })
      );
      const expectedRes = {
        variant: BookingsCountdownVariant.SecondDeadline,
        month: currentDate.startOf("month"),
        deadline: extendedDateLuxon,
      };
      expect(getCountdownProps(store.getState())).toEqual(expectedRes);
    });

    test("should not display any countdown for admin", () => {
      const store = getNewStore();
      const currentDate = mockDate.plus({ months: 2 });
      store.dispatch(changeCalendarDate(currentDate));
      store.dispatch({ type: Action.UpdateAdminStatus, payload: true });
      expect(getCountdownProps(store.getState())).toEqual(undefined);
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
      expect(getCountdownProps(store.getState())).toEqual(expectedRes);
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
          expect(getMonthEmptyForBooking(store.getState())).toEqual(wantRes);
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
          interval: bookedInterval,
          bookingNotes,
        },
      ]);
    });
  });
});
