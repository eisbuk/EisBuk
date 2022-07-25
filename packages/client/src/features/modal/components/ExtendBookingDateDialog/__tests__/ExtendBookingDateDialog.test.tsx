/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import i18n, { ActionButton } from "@eisbuk/translations";

import ExtendBookingDateDialog from "../ExtendBookingDateDialog";
import * as customerOperations from "@/store/actions/customerOperations";

import { saul } from "@/__testData__/customers";

const mockOnClose = jest.fn();
// Mock extendBookingDate to a, sort of, identity function
// to test it being dispatched to the store (with appropriate params)
// rather than just being called
const mockExtendBookingDate = (...params: any) => ({
  params,
  type: "extendBookingDate",
});
jest
  .spyOn(customerOperations, "extendBookingDate")
  .mockImplementation(mockExtendBookingDate as any);

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("ExtendBookingDateDialog", () => {
  beforeEach(() => {
    render(<ExtendBookingDateDialog {...saul} onClose={mockOnClose} />);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  test("should call onClose on cancel", () => {
    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("should call delete customer with customer data and close the modal on confirm", async () => {
    userEvent.type(screen.getByRole("textbox"), "2022-01-01");
    screen.getByText(i18n.t(ActionButton.ExtendBookingDate) as string).click();
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        mockExtendBookingDate(saul.id, "2022-01-01")
      );
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});