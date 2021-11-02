import React from "react";
import { cleanup, screen, render } from "@testing-library/react";

import { ActionButton } from "@/enums/translations";

import BookingCard from "../BookingCard";

import { baseProps } from "../__testData__/dummyData";

import i18n from "@/__testUtils__/i18n";

describe("Interval Card ->", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  test("should render properly", () => {
    render(<BookingCard {...baseProps} />);
  });
  describe("Test button functionality ->", () => {
    const mockBookInterval = jest.fn();
    const mockCancelBooking = jest.fn();

    test("should fire `bookInterval` on click, if the interval is not already booked", () => {
      render(<BookingCard {...baseProps} bookInterval={mockBookInterval} />);
      screen.getByText(i18n.t(ActionButton.BookInterval) as string).click();
      expect(mockBookInterval).toHaveBeenCalled();
    });
    test("should fire `cancelBooking` on click, if the interval is booked", () => {
      render(
        <BookingCard {...baseProps} booked cancelBooking={mockCancelBooking} />
      );
      screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
      expect(mockCancelBooking).toHaveBeenCalled();
    });
  });
});
