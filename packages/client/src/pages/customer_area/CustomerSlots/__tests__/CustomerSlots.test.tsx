/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup } from "@testing-library/react";
import * as reactRedux from "react-redux";

import i18n, { ActionButton } from "@eisbuk/translations";

import { CustomerRoute } from "@/enums/routes";

import CustomerSlots from "../CustomerSlots";

import * as bookingActions from "@/store/actions/bookingOperations";
import { changeCalendarDate } from "@/store/actions/appActions";

import { __dateNavNextId__, __noSlotsDateId__ } from "@/__testData__/testIds";
import { slotsMonth } from "@/__testData__/slots";
import { testDateLuxon, testDate } from "@/__testData__/date";
import { comparePeriods } from "@/utils/helpers";

/**
 * Mock function we'll be using to test dispatching to the store
 */
const mockDispatch = jest.fn();
jest.spyOn(reactRedux, "useSelector").mockImplementation(() => testDateLuxon);
jest.spyOn(reactRedux, "useDispatch").mockImplementation(() => mockDispatch);

const secretKey = "secret-key";
jest.mock("react-router", () => ({
  useParams: () => ({ secretKey: "secret-key" }),
}));
jest.mock("@/utils/firebase", () => ({
  createCloudFunctionCaller: jest.fn(),
}));
describe("CustomerSlots", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("Test pagination", () => {
    test("should paginate by month if 'view=\"book_ice\"'", () => {
      render(
        <CustomerSlots
          slots={slotsMonth}
          rawSlots={slotsMonth}
          view={CustomerRoute.BookIce}
        />
      );
      screen.getByTestId(__dateNavNextId__).click();
      // we're expecting next date to be a month jump from our first date
      const expectedDate = testDateLuxon.plus({ months: 1 });
      expect(mockDispatch).toHaveBeenCalledWith(
        changeCalendarDate(expectedDate)
      );
    });

    test("should paginate by month if 'view=\"book_off_ice\"'", () => {
      render(
        <CustomerSlots
          slots={slotsMonth}
          rawSlots={slotsMonth}
          view={CustomerRoute.BookOffIce}
        />
      );
      screen.getByTestId(__dateNavNextId__).click();
      // we're expecting next date to be a month jump from our first date
      const expectedDate = testDateLuxon.plus({ months: 1 });
      expect(mockDispatch).toHaveBeenCalledWith(
        changeCalendarDate(expectedDate)
      );
    });
  });
  test("should show alert message when there are no slots available for the whole month in ice", () => {
    render(
      <CustomerSlots rawSlots={{}} slots={{}} view={CustomerRoute.BookIce} />
    );
    screen.getByTestId(__noSlotsDateId__);
  });
  test("should show alert message when there are no slots available for the whole month in off-ice", () => {
    render(
      <CustomerSlots rawSlots={{}} slots={{}} view={CustomerRoute.BookOffIce} />
    );
    screen.getByTestId(__noSlotsDateId__);
  });

  describe("Test interval booking actions", () => {
    // we're passing a slot month (for type safety), but we'll be testing actions only on the first slot
    const slotId = "slot-0";
    const testSlot = slotsMonth["2021-03-01"][slotId];
    const customerId = "customer-id";

    // mock implementations for `bookInterval` and `cancelBooking`
    // we'll be using those implementations to easier test dispatching to store with appropriate actions
    // as well as mocking implementations of said functions within the component
    const mockBookImplementation = (
      payload: Parameters<typeof bookingActions.bookInterval>[0]
    ) => payload;
    const mockCancelImplementation = (
      payload: Parameters<typeof bookingActions.cancelBooking>[0]
    ) => payload;

    // apply mock implenetations to component
    jest
      .spyOn(bookingActions, "bookInterval")
      .mockImplementation(mockBookImplementation as any);
    jest
      .spyOn(bookingActions, "cancelBooking")
      .mockImplementation(mockCancelImplementation as any);

    test("should book given interval of given slot on click", () => {
      // we try booking the first interval of the first slot
      const testInterval = Object.keys(testSlot.intervals).sort(
        comparePeriods
      )[0];
      render(
        <CustomerSlots
          slots={slotsMonth}
          rawSlots={slotsMonth}
          {...{ customerId }}
        />
      );
      // we're looking for first interval button
      screen
        .queryAllByText(i18n.t(ActionButton.BookInterval) as string)[0]
        .click();
      // create a mock redux action to test dispatch being called with proper data
      const mockBookAction = mockBookImplementation({
        bookedInterval: testInterval,
        secretKey,
        slotId,
        date: testDate,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockBookAction);
    });

    test("should unsubscribe from duration on click if that duration is subscribed to", () => {
      // we'll be using the first interval from test slot as booked interval
      const bookedInterval = Object.keys(testSlot.intervals)[0];
      const bookedSlots = {
        [slotId]: { date: testDate, interval: bookedInterval },
      };
      render(
        <CustomerSlots
          slots={slotsMonth}
          rawSlots={slotsMonth}
          {...{ bookedSlots, customerId }}
        />
      );
      screen.queryAllByText(i18n.t(ActionButton.Cancel) as string)[0].click();
      // create a mock redux action to test dispatch being called with proper data
      const mockCancelAction = mockCancelImplementation({
        slotId,
        secretKey,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockCancelAction);
    });
  });
});
