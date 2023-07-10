import React from "react";
import { vi, afterEach, expect, test, describe } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import CustomerGrid from "../CustomerGrid";

import { saul, gus } from "@eisbuk/testing/customers";

describe("CustomerGrid", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  vi.mock("react-router-dom", () => ({
    ...vi.importActual("react-router-dom"),
    useHistory: () => ({ location: { search: "?approvals=true" } }),
  }));

  test("should only display unapproved athletes on athletes_approval view", async () => {
    const mockOnCustomerClick = vi.fn();
    render(
      <CustomerGrid
        customers={[gus, saul]}
        onCustomerClick={mockOnCustomerClick}
      />
    );

    screen.getByText(gus.name).click();
    await waitFor(() => expect(mockOnCustomerClick).toHaveBeenCalledWith(gus));
  });
});
