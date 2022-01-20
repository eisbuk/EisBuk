import React from "react";
import { cleanup, screen, render } from "@testing-library/react";
import { SlotType } from "eisbuk-shared";

import { ActionButton } from "@/enums/translations";
import { BookingDuration } from "@/enums/components";

import BookingCard from "../BookingCard";

import i18n from "@/__testUtils__/i18n";

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
  });

  describe("Test duration display", () => {
    test("should display duration of the interval", () => {
      render(<BookingCard {...baseProps} />);
      screen.getByText(BookingDuration["1.5h"]);
    });

    test("should round duration to the nearest half hour", () => {
      // test for 1:01 h duration (should be rounded to 1h)
      const hourLongInterval = { startTime: "10:00", endTime: "11:01" };
      render(
        <BookingCard
          {...{
            ...baseProps,
            interval: hourLongInterval,
          }}
        />
      );
      screen.getByText(BookingDuration["1h"]);
      // test for 1:28 h duration (should be rounded to 1.5h)
      cleanup();
      const hourAndHalfLongInterval = { startTime: "10:00", endTime: "11:28" };
      render(
        <BookingCard
          {...{
            ...baseProps,
            interval: hourAndHalfLongInterval,
          }}
        />
      );
      screen.getByText(BookingDuration["1.5h"]);
    });

    test("If duration longer than 2 hours, should display duration as 2+", () => {
      const extraLongInterval = { startTime: "10:00", endTime: "12:01" };
      render(
        <BookingCard
          {...{
            ...baseProps,
            interval: extraLongInterval,
          }}
        />
      );
      screen.getByText(BookingDuration["2+h"]);
      // test for 2h straight duration (should be rendered normally)
      cleanup();
      const twoHoursStraight = { startTime: "10:00", endTime: "12:00" };
      render(
        <BookingCard
          {...{
            ...baseProps,
            interval: twoHoursStraight,
          }}
        />
      );
      screen.getByText(BookingDuration["2h"]);
    });
  });
});
