import { DateTime } from "luxon";

import {
  getCustomerBase,
  BookingSubCollection,
  OrgSubCollection,
} from "eisbuk-shared";

import { Action } from "@/enums/store";
import { BookingCountdown } from "@/enums/translations";

import { getNewStore } from "@/store/createStore";

import { getIsBookingAllowed, getShouldDisplayCountdown } from "../bookings";

import { changeCalendarDate } from "@/store/actions/appActions";
import { updateLocalDocuments } from "@/react-redux-firebase/actions";

import { saul } from "@/__testData__/customers";

const dateNowSpy = jest.spyOn(Date, "now");

describe("Selectors ->", () => {
  describe("Test 'getCanBook' selector", () => {
    test("should allow admin to book at all times", () => {
      // set up test with `isAdmin === true`
      const store = getNewStore();
      store.dispatch({ type: Action.UpdateAdminStatus, payload: true });
      expect(getIsBookingAllowed(store.getState())).toEqual(true);
    });

    test("should not allow booking if the booking deadline for the month is passed", () => {
      // set up test state with non-passable date
      const store = getNewStore();
      // should not be able to book next month (excluding special cases)
      // if less than 5 days until end of the month
      const slotsDate = DateTime.fromISO("2022-01-30");
      // we're viewing the slots for next month
      store.dispatch(changeCalendarDate(slotsDate));
      // mock non-pasable date
      const mockDate = DateTime.fromISO("2021-12-27").toMillis();
      dateNowSpy.mockReturnValue(mockDate);
      expect(getIsBookingAllowed(store.getState())).toEqual(false);
      // check past month for good measure
      store.dispatch(changeCalendarDate(slotsDate.minus({ months: 2 })));
      expect(getIsBookingAllowed(store.getState())).toEqual(false);
    });

    test("should allow booking if within reasonable boundaries (the booking deadline hasn't yet passed)", () => {
      // set up test store with passable date
      const store = getNewStore();
      // slots two months from now should certainly be bookable
      const passableDate = DateTime.now().plus({ months: 2 });
      store.dispatch(changeCalendarDate(passableDate));
      expect(getIsBookingAllowed(store.getState())).toEqual(true);
    });

    test("should allow booking if customer has an 'extendedDate'", () => {
      // set up test state with non-passable date
      const store = getNewStore();
      const slotsDate = DateTime.fromISO("2022-01-30");
      store.dispatch(changeCalendarDate(slotsDate));
      // set customer with `extendedDate` to store
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.Bookings, {
          ["secret-key"]: {
            ...getCustomerBase(saul),
            extendedDate: "2021-12-30",
          },
        })
      );
      // mock current date to be non-passable, but still within boundaries of `extendedDate`
      const mockDate = DateTime.fromISO("2021-12-27").toMillis();
      dateNowSpy.mockReturnValue(mockDate);
      expect(getIsBookingAllowed(store.getState())).toEqual(true);
    });

    test("edge case: should only allow 'extendedDate' booking for the appropriate month", () => {
      // set up test state with non-passable date
      const store = getNewStore();
      // set customer with `extendedDate` to store
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.Bookings, {
          ["secret-key"]: {
            ...getCustomerBase(saul),
            extendedDate: "2021-12-30",
          },
        })
      );
      const slotsDate = DateTime.fromISO("2021-12-30");
      store.dispatch(changeCalendarDate(slotsDate));
      // mock current date is within boundaries of `extendedDate`
      // but `extendedDate` is not aplicable to the observed month
      const mockDate = DateTime.fromISO("2021-12-27").toMillis();
      dateNowSpy.mockReturnValue(mockDate);
      expect(getIsBookingAllowed(store.getState())).toEqual(false);
    });

    test("edge case: time difference shouldn't affect the result, just the month difference", () => {
      // we want to make sure that booking is allowed even if
      // booking date (redux `currentDate`) - Date.now() < 30 days, but still before due date
      const allowedDate = DateTime.fromISO("2021-12-26").toMillis();
      // booking date is not a full month away from "2021-12-26"
      // but belong to next month, and booking due date for "next month" ("2021-12-27") is not yet passed
      const bookingDate = DateTime.fromISO("2022-01-01");
      dateNowSpy.mockReturnValue(allowedDate);
      const store = getNewStore();
      store.dispatch(changeCalendarDate(bookingDate));
      expect(getIsBookingAllowed(store.getState())).toEqual(true);
    });
  });

  describe("getShouldDisplayContdown", () => {
    test("should display countdown if current date within countdown range (from first deadline)", () => {
      const store = getNewStore();
      // we're testing for two days before the deadline
      // but might enable preferences in the future
      const februaryDeadline = DateTime.fromISO("2022-01-27");
      const testDate = februaryDeadline.minus({ days: 2 });
      dateNowSpy.mockReturnValue(testDate.toMillis());
      const expectedRes = {
        message: BookingCountdown.FirstDeadline,
        // should countdown to the start of the deadline
        deadline: februaryDeadline,
        // should return month currently active for booking ("February")
        month: DateTime.fromISO("2022-02"),
      };
      // test while observing the active month
      store.dispatch(changeCalendarDate(DateTime.fromISO("2022-02")));
      expect(getShouldDisplayCountdown(store.getState())).toEqual(expectedRes);
      // test while observing another month (the countdown should still be there)
      store.dispatch(changeCalendarDate(DateTime.fromISO("2022-08")));
      expect(getShouldDisplayCountdown(store.getState())).toEqual(expectedRes);
    });

    test("should not display countdown if booking deadline not within countdown range", () => {
      const store = getNewStore();
      // we're testing for two days before the deadline
      // but might enable preferences in the future
      const februaryDeadline = DateTime.fromISO("2022-01-27");
      const testDate = februaryDeadline.minus({ days: 3 });
      dateNowSpy.mockReturnValue(testDate.toMillis());
      const { message } = getShouldDisplayCountdown(store.getState());
      expect(message).toEqual(undefined);
    });

    test("should not display countdown if passed booking deadline (and 'extendedDate' assigned)", () => {
      const store = getNewStore();
      // we're testing for two days before the deadline
      // but might enable preferences in the future
      const februaryDeadline = DateTime.fromISO("2022-01-27");
      const testDate = februaryDeadline.plus({ days: 2 });
      dateNowSpy.mockReturnValue(testDate.toMillis());
      const { message } = getShouldDisplayCountdown(store.getState());
      expect(message).toEqual(undefined);
    });

    test("should not display countdown (regardless of deadline being near) if there's at least one slot booked for next month", () => {
      const februaryDeadline = DateTime.fromISO("2022-01-27");
      const testDate = februaryDeadline.minus({ days: 2 });
      const store = getNewStore();
      store.dispatch(
        updateLocalDocuments(BookingSubCollection.BookedSlots, {
          ["test-booking"]: {
            date: "2022-02-01",
            interval: "10:00-11:00",
          },
        })
      );
      dateNowSpy.mockReturnValue(testDate.toMillis());
      const { message } = getShouldDisplayCountdown(store.getState());
      expect(message).toEqual(undefined);
    });

    test("should display countdown if in and extended date period", () => {
      const store = getNewStore();
      const extendedDate = "2022-01-05";
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.Bookings, {
          ["secret-key"]: getCustomerBase({ ...saul, extendedDate }),
        })
      );
      // set the date to be between first deadline and `extendedDate`
      const testDate = DateTime.fromISO("2022-01-01");
      dateNowSpy.mockReturnValue(testDate.toMillis());
      const expectedRes = {
        message: BookingCountdown.SecondDeadline,
        // deadline should be the very end of the extended date
        deadline: DateTime.fromISO(extendedDate).endOf("day"),
        // the month (later interpolated for countdown message) should be
        // the month of the bookings (still "January, 2022")
        month: DateTime.fromISO("2022-01"),
      };
      // test while observing the current booking month
      store.dispatch(changeCalendarDate(DateTime.fromISO("2022-01-01")));
      expect(getShouldDisplayCountdown(store.getState())).toEqual(expectedRes);
      // the countdown should be shown regardles of which month we're currently observing
      store.dispatch(changeCalendarDate(DateTime.fromISO("2022-05-01")));
      expect(getShouldDisplayCountdown(store.getState())).toEqual(expectedRes);
    });
  });
});
