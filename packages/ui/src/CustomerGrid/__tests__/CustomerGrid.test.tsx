import React from "react";
import { vi, afterEach, expect, test, describe } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import CustomerGrid from "../CustomerGrid";

import { saul } from "@eisbuk/testing/customers";

describe("CustomerGrid", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should call 'onCustomerClick', passing customer as a param on customer item click", async () => {
    vi.mock("react-router-dom", () => ({
      ...vi.importActual("react-router-dom"),
      useHistory: () => ({ location: {} }),
    }));
    const mockOnCustomerClick = vi.fn();
    render(
      <CustomerGrid customers={[saul]} onCustomerClick={mockOnCustomerClick} />
    );
    screen.getByText(saul.name).click();
    await waitFor(() => expect(mockOnCustomerClick).toHaveBeenCalledWith(saul));
  });
});
