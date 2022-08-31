/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";

import i18n, { ActionButton } from "@eisbuk/translations";

import BookingCardGroup from "../BookingCardGroup";

import * as bookingOperations from "@/store/actions/bookingOperations";

import { intervals, baseSlot } from "@/__testData__/slots";
import { testDate } from "@/__testData__/date";
import { comparePeriods } from "@/utils/sort";

const secretKey = "secret-key";

jest.mock("react-router", () => ({
  useParams: () => ({ secretKey: "secret-key" }),
}));

jest.mock("@/utils/firebase", () => ({
  createCloudFunctionCaller: jest.fn(),
}));

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
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
      render(<BookingCardGroup {...baseSlot} />);
    });
  });

  describe("Test booking functionality ->", () => {
    const intervalKeys = Object.keys(intervals).sort(comparePeriods);
    const bookedInterval = intervalKeys[0];
    const { id: slotId } = baseSlot;

    beforeEach(() => {
      render(
        <BookingCardGroup {...{ ...baseSlot, bookedInterval, intervals }} />
      );
    });

    test("should switch booked interval on 'bookInterval' click (on a non-booked interval)", () => {
      screen
        .getAllByText(i18n.t(ActionButton.BookInterval) as string)[0]
        .click();
      const mockBookAction = mockBookImplementation({
        slotId,
        secretKey,
        bookedInterval: intervalKeys[1],
        date: testDate,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockBookAction);
    });

    test("should remove booked interval on 'cancelBooking' click", () => {
      screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
      const mockCancelAction = mockCancelImplementation({
        slotId,
        secretKey,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockCancelAction);
    });
  });
});
