import { vi, expect, test, describe } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import { Cake } from "@eisbuk/svg";

import IconButton from "./IconButton";

describe("IconButton", () => {
  describe("Test basic functionality", () => {
    test("should lift 'onClick'", () => {
      const mockOnClick = vi.fn();
      render(
        <IconButton onClick={mockOnClick}>
          <Cake />
        </IconButton>
      );
      screen.getByRole("button").click();
      expect(mockOnClick).toHaveBeenCalled();
    });
  });
});
