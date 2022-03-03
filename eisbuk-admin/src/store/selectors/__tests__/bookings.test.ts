import { DateTime } from "luxon";

import { getCustomerBase, OrgSubCollection } from "eisbuk-shared";

import { Action } from "@/enums/store";
import { BookingCountdownMessage } from "@/enums/translations";

import { getNewStore } from "@/store/createStore";

import { getIsBookingAllowed, getCountdownProps } from "../bookings";

import { updateLocalDocuments } from "@/react-redux-firebase/actions";

import { saul } from "@/__testData__/customers";

// set date mock to be a consistent date throughout
const mockDate = DateTime.fromISO("2022-02-05");
const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(mockDate.toMillis());

describe("Selectors ->", () => {
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
      const expectedRes = {
        // if not in extended date period, should always show first deadline
        message: BookingCountdownMessage.FirstDeadline,
        month: currentDate.startOf("month"),
        deadline: currentDate
          // bookings are locked before the month begins
          .minus({ months: 1 })
          .endOf("month")
          // we're testing for (default) 5 days locking period
          .minus({ days: 5 })
          .endOf("day"),
      };
      expect(getCountdownProps(currentDate)(store.getState())).toEqual(
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
      // grant (saul) our test customer an extended date for february ("2022-02-07")
      store.dispatch(
        updateLocalDocuments(OrgSubCollection.Bookings, {
          [saul.secretKey]: getCustomerBase({ ...saul, extendedDate }),
        })
      );
      const expectedRes = {
        message: BookingCountdownMessage.SecondDeadline,
        month: currentDate.startOf("month"),
        deadline: extendedDateLuxon,
      };
      expect(getCountdownProps(currentDate)(store.getState())).toEqual(
        expectedRes
      );
    });

    test("should not display any countdown for admin", () => {
      const store = getNewStore();
      const currentDate = mockDate.plus({ months: 2 });
      store.dispatch({ type: Action.UpdateAdminStatus, payload: true });
      expect(getCountdownProps(currentDate)(store.getState())).toEqual(
        undefined
      );
    });

    test("should display bookings are locked message (instead of countdown) if bookings for this period are locked", () => {
      const store = getNewStore();
      // bookings for a current month (the month we're in) should (trivially) be locked
      const currentDate = mockDate;
      const expectedRes = {
        message: BookingCountdownMessage.BookingsLocked,
        deadline: null,
        month: currentDate.startOf("month"),
      };
      expect(getCountdownProps(currentDate)(store.getState())).toEqual(
        expectedRes
      );
    });
  });
});
