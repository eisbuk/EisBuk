import React from "react";
import { render, screen, cleanup } from "@testing-library/react";

import { ActionButton } from "@/enums/translations";

import BookingCardGroup from "../BookingCardGroup";

import * as bookingOperations from "@/store/actions/bookingOperations";

import { intervals, slot } from "../__testData__/dummyData";
import { testDate } from "@/__testData__/date";

const secretKey = "secret-key";

jest.mock("react-router", () => ({
  useParams: () => ({ secretKey: "secret-key" }),
}));

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (str: string) => str }),
}));

// mock implementations we're using for easier testing
// as well as to mock implementation insode the component
const mockBookImplementation = (
  payload: Parameters<typeof bookingOperations.bookInterval>[0]
) => payload;
const mockCancelImplementation = (
  payload: Parameters<typeof bookingOperations.cancelBooking>[0]
) => payload;

// mocked functions to controll in-component behavior
jest
  .spyOn(bookingOperations, "bookInterval")
  .mockImplementation(mockBookImplementation as any);
jest
  .spyOn(bookingOperations, "cancelBooking")
  .mockImplementation(mockCancelImplementation as any);

describe("Booking Card Group ->", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("Smoke test ->", () => {
    test("should render", () => {
      render(
        <>
          <BookingCardGroup {...slot} />
        </>
      );
    });
  });

  describe("Test booking functionality ->", () => {
    const intervalKeys = Object.keys(intervals);
    const bookedInterval = intervalKeys[0];
    const { id: slotId } = slot;

    beforeEach(() => {
      render(
        <>{<BookingCardGroup {...{ ...slot, bookedInterval, intervals }} />}</>
      );
    });

    test("should switch booked interval on 'bookInterval' click (on a non-booked interval)", () => {
      screen.getAllByText(ActionButton.BookInterval)[0].click();
      const mockBookAction = mockBookImplementation({
        slotId,
        secretKey,
        bookedInterval: intervalKeys[1],
        date: testDate,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockBookAction);
    });

    test("should remove booked interval on 'cancelBooking' click", () => {
      screen.getByText(ActionButton.Cancel).click();
      const mockCancelAction = mockCancelImplementation({
        slotId,
        secretKey,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockCancelAction);
    });

    test("should disable all buttons while the state is syncing (bookedInterval and localSelected are in discrepency)", () => {
      // the `bookedInterval` prop has athe value of the first interval, this way we're setting i to  null
      screen.getByText(ActionButton.Cancel).click();
      screen.getAllByRole("button").forEach((button) => {
        expect(button).toHaveProperty("disabled", true);
      });
    });
  });
});
