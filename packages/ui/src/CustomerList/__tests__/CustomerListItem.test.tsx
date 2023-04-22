import { vi, afterEach, expect, test, describe } from "vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import CustomerListItem from "../CustomerListItem";

import { saul } from "@eisbuk/test-data/customers";

describe("CustomerList", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe("CustomerListItem", () => {
    const mockOnClick = vi.fn();

    const saulRegex = new RegExp(saul.name);

    test("should call 'onClick' with customer data on component click", () => {
      render(<CustomerListItem {...{ ...saul }} onClick={mockOnClick} />);
      screen.getByText(saulRegex).click();
      expect(mockOnClick).toHaveBeenCalledWith(saul);
    });
  });
});
