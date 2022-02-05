import { DateTime } from "luxon";

import { Action } from "@/enums/store";

import { getNewStore } from "@/store/createStore";

import { changeCalendarDate } from "@/store/actions/appActions";

import { getIsBookingAllowed } from "../bookings";

const dateNowSpy = jest.spyOn(Date, "now");

describe("Selectors ->", () => {
  describe("Test 'getCanBook' selector", () => {
    test("should allow admin to book at all times", () => {
      // set up test with `isAdmin === true`
      const store = getNewStore();
      store.dispatch({ type: Action.UpdateAdminStatus, payload: true });
      expect(getIsBookingAllowed(store.getState())).toEqual(true);
    });

    test("should not allow booking if the latest booking date for the month is passed", () => {
      // set up test state with non-passable date
      const store = getNewStore();
      // should not be able to book next month (excluding special cases)
      // if less than 5 days until end of the month
      const slotsDate = DateTime.now().plus({ months: 1 });
      // we're viewing the slots for next month
      store.dispatch(changeCalendarDate(slotsDate));
      // mock non-pasable date
      const mockDate = DateTime.now()
        .endOf("month")
        .minus({ days: 5 })
        .plus({ hours: 1 })
        .toMillis();
      dateNowSpy.mockReturnValueOnce(mockDate);
      expect(getIsBookingAllowed(store.getState())).toEqual(false);
      // check past month for good measure
      store.dispatch(changeCalendarDate(slotsDate.minus({ months: 2 })));
      expect(getIsBookingAllowed(store.getState())).toEqual(false);
    });

    test("should allow booking if within reasonable boundaries (the latest booking date hasn't yet passed)", () => {
      // set up test store with passable date
      const store = getNewStore();
      // slots two months from now should certainly be bookable
      const passableDate = DateTime.now().plus({ months: 2 });
      store.dispatch(changeCalendarDate(passableDate));
      expect(getIsBookingAllowed(store.getState())).toEqual(true);
    });

    test("edge case: time difference shouldn't affect the result, just the month difference", () => {
      // we want to make sure that booking is allowed even if
      // booking date (redux `currentDate`) - Date.now() < 30 days, but still before due date
      const allowedDate = DateTime.fromISO("2021-12-26").toMillis();
      // booking date is not a full month away from "2021-12-26"
      // but belong to next month, and booking due date for "next month" ("2021-12-27") is not yet passed
      const bookingDate = DateTime.fromISO("2022-01-01");
      dateNowSpy.mockReturnValueOnce(allowedDate);
      const store = getNewStore();
      store.dispatch(changeCalendarDate(bookingDate));
      expect(getIsBookingAllowed(store.getState())).toEqual(true);
    });
  });
});
