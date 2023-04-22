import { vi, expect, test, describe } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import Button from "../Button";

describe("Button", () => {
  test("should bubble up click event", () => {
    const mockOnClick = vi.fn();
    render(<Button onClick={mockOnClick}>Click me</Button>);
    screen.getByText("Click me").click();
    expect(mockOnClick).toHaveBeenCalled();
  });
});
