/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, waitFor } from "@testing-library/react";

import i18n, { ActionButton } from "@eisbuk/translations";

import CustomerFormDialog from "../CustomerFormDialog";

import * as customerOperations from "@/store/actions/customerOperations";

import { saul } from "@/__testData__/customers";

const mockOnClose = jest.fn();
// Mock updateCustomer to a, sort of, identity function
// to test it being dispatched to the store (with appropriate params)
// rather than just being called
const mockUpdateCustomer = (params: any) => ({
  ...params,
  type: "deleteSlot",
});
jest
  .spyOn(customerOperations, "updateCustomer")
  .mockImplementation(mockUpdateCustomer as any);

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: () => undefined,
}));

describe("CustomerFormDialog", () => {
  beforeEach(() => {
    render(
      <CustomerFormDialog
        onCloseAll={() => {}}
        onClose={mockOnClose}
        customer={saul}
      />
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should call 'onClose' on cancel", () => {
    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test("should update customer on save button click", async () => {
    screen.getByText(i18n.t(ActionButton.Save) as string).click();
    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith(mockUpdateCustomer(saul))
    );
    expect(mockOnClose).toHaveBeenCalled();
  });
});
