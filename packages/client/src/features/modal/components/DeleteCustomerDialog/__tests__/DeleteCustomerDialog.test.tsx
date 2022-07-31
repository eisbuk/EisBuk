/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup } from "@testing-library/react";

import i18n, { ActionButton } from "@eisbuk/translations";

import DeleteCustomerDialog from "../DeleteCustomerDialog";
import * as customerOperations from "@/store/actions/customerOperations";

import { saul } from "@/__testData__/customers";

const mockOnClose = jest.fn();
const mockOnCloseAll = jest.fn();
// Mock deleteCustomer to a, sort of, identity function
// to test it being dispatched to the store (with appropriate params)
// rather than just being called
const mockDeleteCustomer = (params: any) => ({
  ...params,
  type: "deleteCustomer",
});
jest
  .spyOn(customerOperations, "deleteCustomer")
  .mockImplementation(mockDeleteCustomer as any);

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("DeleteCustomerDialog", () => {
  beforeEach(() => {
    render(
      <DeleteCustomerDialog
        {...saul}
        onClose={mockOnClose}
        onCloseAll={mockOnCloseAll}
      />
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  test("should call 'onClose' on cancel", () => {
    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnCloseAll).not.toHaveBeenCalled();
  });

  test("should call delete customer with customer data and close all of the modals on confirm", () => {
    screen.getByText(i18n.t(ActionButton.Delete) as string).click();
    expect(mockDispatch).toHaveBeenCalledWith(mockDeleteCustomer(saul));
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnCloseAll).toHaveBeenCalled();
  });
});
