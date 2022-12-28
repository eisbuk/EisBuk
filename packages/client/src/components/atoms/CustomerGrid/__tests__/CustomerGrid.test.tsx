/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import { __testOrganization__ } from "@/__testSetup__/envData";

import CustomerGrid from "../CustomerGrid";

import { saul } from "@/__testData__/customers";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

describe("CustomerGrid", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should open customer in CustomerCard modal on customer click", async () => {
    render(
      <CustomerGrid displayName={__testOrganization__} customers={[saul]} />
    );
    screen.getByText(saul.name).click();
    await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
    const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
    expect(dispatchCallPayload.component).toEqual("CustomerCard");
    expect(dispatchCallPayload.props).toEqual({
      customer: saul,
    });
  });
});
