import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { SlotType } from "@eisbuk/shared";

import { IntervalCardState, IntervalCardVariant } from "../types";

import IntervalCard from "../IntervalCard";

const baseProps = {
  date: "2022-04-01",
  interval: {
    startTime: "09:00",
    endTime: "10:00",
  },
  type: SlotType.Ice,
};

interface TestParams {
  variant: IntervalCardVariant;
  state: IntervalCardState;
  onBook: boolean;
  onCancel: boolean;
}

const runBookingTableTests = (tests: TestParams[]) => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const mockOnBook = jest.fn();
  const mockOnCancel = jest.fn();

  tests.forEach(({ variant, state, onBook, onCancel }) =>
    test(`variant: "${variant}", state: "${state}", should call 'onBook': ${onBook}, should call 'onCancel': ${onCancel}`, () => {
      render(
        <IntervalCard
          {...{ ...baseProps, variant, state }}
          onBook={mockOnBook}
          onCancel={mockOnCancel}
        />
      );

      screen.getByRole("button").click();

      expect(mockOnBook).toHaveBeenCalledTimes(Number(onBook));
      expect(mockOnCancel).toHaveBeenCalledTimes(Number(onCancel));
    })
  );
};

describe("IntervalCard", () => {
  runBookingTableTests([
    // Variant: "Booking"
    {
      variant: IntervalCardVariant.Booking,
      state: IntervalCardState.Default,
      onBook: true,
      onCancel: false,
    },
    {
      variant: IntervalCardVariant.Booking,
      state: IntervalCardState.Active,
      onBook: false,
      onCancel: true,
    },
    {
      variant: IntervalCardVariant.Booking,
      state: IntervalCardState.Faded,
      onBook: true,
      onCancel: false,
    },
    {
      variant: IntervalCardVariant.Booking,
      state: IntervalCardState.Disabled,
      onBook: false,
      onCancel: false,
    },

    // Variant: "Calendar"
    {
      variant: IntervalCardVariant.Calendar,
      state: IntervalCardState.Default,
      onBook: false,
      onCancel: true,
    },
    {
      variant: IntervalCardVariant.Calendar,
      state: IntervalCardState.Active,
      onBook: false,
      onCancel: true,
    },
    {
      variant: IntervalCardVariant.Calendar,
      state: IntervalCardState.Faded,
      onBook: false,
      onCancel: true,
    },
    {
      variant: IntervalCardVariant.Calendar,
      state: IntervalCardState.Disabled,
      onBook: false,
      onCancel: false,
    },
  ]);
});
