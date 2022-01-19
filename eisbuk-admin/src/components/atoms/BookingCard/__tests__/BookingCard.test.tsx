import React from "react";
import { cleanup, screen, render } from "@testing-library/react";
import { SlotType } from "eisbuk-shared";

import { ActionButton } from "@/enums/translations";

import BookingCard from "../BookingCard";

import i18n from "@/__testUtils__/i18n";
import { BookingDuration } from "@/enums/components";

export const baseProps: Parameters<typeof BookingCard>[0] = {
  date: "2022-01-01",
  type: SlotType.Ice,
  interval: {
    startTime: "09:00",
    endTime: "10:30",
  },
  notes: "",
};

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
    test("should display duration of the interval", () => {
      render(
        <BookingCard {...baseProps} booked cancelBooking={mockCancelBooking} />
      );
      screen.getByText(BookingDuration["1.5h"]);
    });
  });
});
