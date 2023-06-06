import React from "react";
import { vi, expect, test, describe } from "vitest";
import { render, screen } from "@testing-library/react";

import DateNavigation from "../DateNavigation";

describe("CelandarNav", () => {
  describe("DateNavigation", () => {
    test("should call 'onPrev' and 'onNext' on respective arrow click", () => {
      const mockOnPrev = vi.fn();
      const mockOnNext = vi.fn();
      render(
        <DateNavigation content="" onPrev={mockOnPrev} onNext={mockOnNext} />
      );
      const [leftButton, rightButton] = screen.getAllByRole("button");
      leftButton.click();
      expect(mockOnPrev).toHaveBeenCalled();
      rightButton.click();
      expect(mockOnNext).toHaveBeenCalled();
    });
  });
});
