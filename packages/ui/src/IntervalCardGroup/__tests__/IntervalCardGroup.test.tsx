import { vi, afterEach, expect, test, describe } from "vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { Category, SlotType } from "@eisbuk/shared";
import i18n, { Alerts } from "@eisbuk/translations";
import { testId } from "@eisbuk/testing/testIds";

import IntervalCardGroup from "../IntervalCardGroup";

const dummySlot = {
  id: "ice-slot",
  type: SlotType.Ice,
  categories: [Category.Competitive],
  date: "2022-01-01",
  intervals: {
    "09:00-11:00": {
      startTime: "09:00",
      endTime: "11:00",
    },
    "09:00-10:30": {
      startTime: "09:00",
      endTime: "10:30",
    },
    "09:00-10:00": {
      startTime: "09:00",
      endTime: "10:00",
    },
  },
};

describe("IntervalCardGroup", () => {
  afterEach(() => {
    cleanup;
    vi.clearAllMocks();
  });

  test("should call 'onBook' with appropriate interval", () => {
    const mockOnBook = vi.fn();
    render(<IntervalCardGroup {...dummySlot} onBook={mockOnBook} />);
    const [firstIntervalButton, , lastIntervalButton] =
      screen.getAllByRole("button");

    // Book first interval
    firstIntervalButton.click();
    expect(mockOnBook).toHaveBeenCalledWith("09:00-11:00");

    // Book last (third) interval
    lastIntervalButton.click();
    expect(mockOnBook).toHaveBeenCalledWith("09:00-10:00");
  });

  test("should call 'onCancel' when 'Cancel' button is clicked on a booked IntervalCard", () => {
    const mockOnCancel = vi.fn();
    render(
      <IntervalCardGroup
        {...dummySlot}
        bookedInterval={"09:00-11:00"}
        onCancel={mockOnCancel}
      />,
    );
    const [firstIntervalButton] = screen.getAllByRole("button");

    // First interval is booked, therefore, its button should be used to cancel
    firstIntervalButton.click();
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test("should still show (as booked, cancellable) a booked interval no longer in the slot's intervals", () => {
    const mockOnCancel = vi.fn();
    const mockOnBook = vi.fn();
    render(
      <IntervalCardGroup
        {...dummySlot}
        // Interval removed from the slot after it was booked
        bookedInterval={"08:00-09:00"}
        onCancel={mockOnCancel}
        onBook={mockOnBook}
      />,
    );

    const cards = screen.getAllByTestId(testId("booking-interval-card"));
    expect(cards).toHaveLength(4);
    const removedCard = cards.find((c) =>
      c.textContent?.includes("08:00 - 09:00"),
    )!;
    expect(removedCard.textContent).toContain(
      i18n.t(Alerts.IntervalRemoved) as string,
    );

    // The removed booked interval is the active one: its button cancels the booking
    (
      removedCard.querySelector(
        `[data-testid="${testId("book-button")}"]`,
      ) as HTMLButtonElement
    ).click();
    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnBook).not.toHaveBeenCalled();
  });
});
