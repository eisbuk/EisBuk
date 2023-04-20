/**
 * @jest-environment jsdom
 */

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import CustomerListItem from "../CustomerListItem";

import { saul } from "../../__testData__/customers";

describe("CustomerList", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("CustomerListItem", () => {
    const mockOnClick = jest.fn();

    const saulRegex = new RegExp(saul.name);

    test("should call 'onClick' with customer data on component click", () => {
      render(<CustomerListItem {...{ ...saul }} onClick={mockOnClick} />);
      screen.getByText(saulRegex).click();
      expect(mockOnClick).toHaveBeenCalledWith(saul);
    });
  });
});
