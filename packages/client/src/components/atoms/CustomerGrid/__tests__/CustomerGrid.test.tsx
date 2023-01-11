/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import { PrivateRoutes } from "@/enums/routes";

import { __testOrganization__ } from "@/__testSetup__/envData";

import CustomerGrid from "../CustomerGrid";

import { saul } from "@/__testData__/customers";

const mockHistoryPush = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({ push: mockHistoryPush }),
}));

describe("CustomerGrid", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should open customer in athlete profile page on customer click", async () => {
    render(
      <CustomerGrid displayName={__testOrganization__} customers={[saul]} />
    );
    screen.getByText(saul.name).click();
    await waitFor(() =>
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `${PrivateRoutes.Athletes}/${saul.id}`
      )
    );
  });
});
