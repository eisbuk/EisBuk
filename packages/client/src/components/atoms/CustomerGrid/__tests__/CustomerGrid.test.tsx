/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";

import CustomerGrid from "../CustomerGrid";

import { saul } from "@/__testData__/customers";
import { openModal } from "@/features/modal/actions";
import { __testOrganization__ } from "@/__testSetup__/envData";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

describe("CustomerGrid", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should open customer in CustomerCard modal on customer click", () => {
    render(
      <CustomerGrid displayName={__testOrganization__} customers={[saul]} />
    );
    screen.getByText(saul.name).click();
    expect(mockDispatch).toHaveBeenCalledWith(
      openModal({
        component: "CustomerCard",
        props: { customer: saul, displayName: __testOrganization__ },
      })
    );
  });
});
