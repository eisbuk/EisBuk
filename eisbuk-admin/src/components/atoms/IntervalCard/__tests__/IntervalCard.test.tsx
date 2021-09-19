import React from "react";
import { cleanup, screen, render } from "@testing-library/react";

import IntervalCard from "../IntervalCard";
import { baseProps } from "../__testData__/dummyData";
import { __bookInterval__, __cancelBooking__ } from "@/lib/labels";

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

    test("should fire `bookInterval` on click, if the interval is not already booked", () => {
      render(<IntervalCard {...baseProps} bookInterval={mockBookInterval} />);
      screen.getByText(__bookInterval__).click();
      expect(mockBookInterval).toHaveBeenCalled();
    });
    test("should fire `cancelBooking` on click, if the interval is booked", () => {
      render(
        <IntervalCard {...baseProps} booked cancelBooking={mockCancelBooking} />
      );
      screen.getByText(__cancelBooking__).click();
      expect(mockCancelBooking).toHaveBeenCalled();
    });
  });
});
