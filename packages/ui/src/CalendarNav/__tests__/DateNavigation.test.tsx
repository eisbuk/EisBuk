import React from "react";
import { render, screen } from "@testing-library/react";

import DateNavigation from "../DateNavigation";

describe("CelandarNav", () => {
  describe("DateNavigation", () => {
    test("should call 'onPrev' and 'onNext' on respective arrow click", () => {
      const mockOnPrev = jest.fn();
      const mockOnNext = jest.fn();
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
