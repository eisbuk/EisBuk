import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Customer } from "eisbuk-shared";

import "@/__testSetup__/firestoreSetup";

import CustomerListItem from "../CustomerListItem";

import * as customerActions from "@/store/actions/customerOperations";

import { saul } from "@/__testData__/customers";

const mockDispatch = jest.fn();
const mockHistoryPush = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock("react-router-dom", () => ({
  useHistory: () => ({ push: mockHistoryPush }),
}));

/**
 * A mock implementation we're using to test dispatching of `deleteCustomer`
 * action. We're returning an action object, rather that annonymus thunk (not comparable)
 */
const mockDeleteCustomerImplementation = (payload: Customer) => ({
  type: "delete",
  payload,
});
/**
 * A mock implementation we're using to test dispatching of `updateCustomer`
 * action. We're returning an action object, rather that annonymus thunk (not comparable)
 */
const mockUpdateCustomerImplementation = (payload: Customer) => ({
  type: "update",
  payload,
});

jest
  .spyOn(customerActions, "deleteCustomer")
  .mockImplementation(mockDeleteCustomerImplementation as any);
jest
  .spyOn(customerActions, "updateCustomer")
  .mockImplementation(mockUpdateCustomerImplementation as any);

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
