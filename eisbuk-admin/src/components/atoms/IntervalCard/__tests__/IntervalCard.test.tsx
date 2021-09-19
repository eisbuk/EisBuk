import React from "react";
import { cleanup, screen, render } from "@testing-library/react";

import IntervalCard from "../IntervalCard";
import * as bookingActions from "@/store/actions/bookingOperations";
import { bookedSlot, nonBookedSlot } from "../__testData__/dummyData";

import { Customer } from "eisbuk-shared";
import { SlotInterface } from "@/types/temp";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
  /** We're mocking this not to fail tests including SlotForm (this will be returning newSlotTime as null) @TODO remove in the future */
  useSelector: () => null,
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ secretKey: "secret_key" }),
}));

/** @TODO remove this when the i18next is instantiated with tests */
jest.mock("i18next", () => ({
  ...jest.requireActual("i18next"),
  /** We're mocking this not to fail certain tests depending on this, but we're not testing the i18n values, so this is ok for now @TODO fix i18n in tests */
  t: () => "",
}));

describe("Interval Card ->", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  // describe
  test("should render properly", () => {
    render(<IntervalCard {...bookedSlot} />);
  });
  describe("Test button functionality ->", () => {
    const mockBookInterval = jest.spyOn(bookingActions, "bookInterval");
    const mockCancelBooking = jest.spyOn(bookingActions, "cancelBooking");

    mockBookInterval.mockImplementationOnce(
      (params: {
        slotId: SlotInterface["id"];
        customerId: Customer["id"];
        bookedInterval: string;
      }) => ({ params })
    );
    mockCancelBooking.mockImplementation(
      (params: {
        slotId: SlotInterface["id"];
        customerId: Customer["id"];
      }) => ({ params })
    );
    test("should fire `bookInterval` on click, if the interval is not already booked", () => {
      render(<IntervalCard {...nonBookedSlot} />);
      const nonBookedSlotLabel = `${nonBookedSlot.interval.startTime}-${nonBookedSlot.interval.endTime}`;
      screen.getByText(nonBookedSlotLabel).click();
      expect(mockDispatch).toHaveBeenCalledWith(mockBookInterval);
    });
    test("should fire `cancelBooking` on click, if the interval is booked", () => {
      render(<IntervalCard {...bookedSlot} />);
      const bookedSlotLabel = `${bookedSlot.interval.startTime}-${bookedSlot.interval.endTime}`;
      screen.getByText(bookedSlotLabel).click();
      expect(mockDispatch).toHaveBeenCalledWith(mockCancelBooking);
    });
  });
});
