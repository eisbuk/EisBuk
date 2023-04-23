/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import CustomerGrid from "../CustomerGrid";

import { saul } from "../../__testData__/customers";

describe("CustomerGrid", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should call 'onCustomerClick', passing customer as a param on customer item click", async () => {
    const mockOnCustomerClick = jest.fn();
    render(
      <CustomerGrid customers={[saul]} onCustomerClick={mockOnCustomerClick} />
    );
    screen.getByText(saul.name).click();
    await waitFor(() => expect(mockOnCustomerClick).toHaveBeenCalledWith(saul));
  });
});
