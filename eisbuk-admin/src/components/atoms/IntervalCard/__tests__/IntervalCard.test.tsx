import React from "react";
import { cleanup, screen, render } from "@testing-library/react";

import IntervalCard from "../IntervalCard";
import { baseProps } from "../__testData__/dummyData";
import { __bookInterval__ } from "@/lib/labels";
import { Customer } from "eisbuk-shared";
import { SlotInterface } from "@/types/temp";

/** @TODO remove this when the i18next is instantiated with tests */
jest.mock("i18next", () => ({
  ...jest.requireActual("i18next"),
  /** We're mocking this not to fail certain tests depending on this, but we're not testing the i18n values, so this is ok for now @TODO fix i18n in tests */
  t: (label: string) => label,
}));

describe("Interval Card ->", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  test("should render properly", () => {
    render(<IntervalCard {...baseProps} />);
  });
  describe("Test button functionality ->", () => {
    const mockBookInterval = jest.fn();
    const mockCancelBooking = jest.fn();

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
      render(<IntervalCard {...baseProps} bookInterval={mockBookInterval} />);
      const nonBookedSlotLabel = `${baseProps.interval.startTime} - ${baseProps.interval.endTime}`;
      screen.getByText(nonBookedSlotLabel).click();
      expect(mockBookInterval).toHaveBeenCalled();
    });
    test("should fire `cancelBooking` on click, if the interval is booked", () => {
      render(
        <IntervalCard {...baseProps} booked cancelBooking={mockCancelBooking} />
      );
      const bookedSlotLabel = `${baseProps.interval.startTime} - ${baseProps.interval.endTime}`;
      screen.getByText(bookedSlotLabel).click();
      expect(mockCancelBooking).toHaveBeenCalled();
    });
  });
});
