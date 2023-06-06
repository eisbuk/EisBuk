import React from "react";
import { vi, afterEach, expect, test, describe } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { SlotType } from "@eisbuk/shared";

import { IntervalCardState, IntervalCardVariant } from "../types";

import BookingButton from "../BookingButton";

const baseProps = {
  type: SlotType.Ice,
  state: IntervalCardState.Default,
  variant: IntervalCardVariant.Booking,
  duration: 0,
};

describe("IntervalCard", () => {
  afterEach(() => {
    cleanup();
  });

  describe("BookingButton", () => {
    test("should fire 'onClick' when clicked", () => {
      const mockOnClick = vi.fn();
      render(<BookingButton {...baseProps} onClick={mockOnClick} />);
      screen.getByRole("button").click();
      expect(mockOnClick).toHaveBeenCalled();
    });

    test("should be disabled if the IntervalCard is disabled", () => {
      const mockOnClick = vi.fn();
      render(
        <BookingButton
          {...baseProps}
          state={IntervalCardState.Disabled}
          onClick={mockOnClick}
        />
      );
      const button = screen.getByRole("button");
      expect(button).toHaveProperty("disabled", true);
    });
  });
});
