import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { Category, SlotType } from "@eisbuk/shared";

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
    jest.clearAllMocks();
  });

  test("should call 'onBook' with appropriate interval", () => {
    const mockOnBook = jest.fn();
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
    const mockOnCancel = jest.fn();
    render(
      <IntervalCardGroup
        {...dummySlot}
        bookedInterval={"09:00-11:00"}
        onCancel={mockOnCancel}
      />
    );
    const [firstIntervalButton] = screen.getAllByRole("button");

    // First interval is booked, therefore, its button should be used to cancel
    firstIntervalButton.click();
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
