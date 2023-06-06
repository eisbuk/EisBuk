/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, afterEach, beforeEach } from "vitest";
import { screen, render, cleanup, waitFor } from "@testing-library/react";

import i18n, { ActionButton } from "@eisbuk/translations";

import ExtendBookingDateDialog from "../ExtendBookingDateDialog";
import * as customerOperations from "@/store/actions/customerOperations";

import { saul } from "@eisbuk/testing/customers";

const mockOnClose = vi.fn();
// Mock extendBookingDate to a, sort of, identity function
// to test it being dispatched to the store (with appropriate params)
// rather than just being called
const mockExtendBookingDate = (...params: any) => ({
  params,
  type: "extendBookingDate",
});
vi.spyOn(customerOperations, "extendBookingDate").mockImplementation(
  mockExtendBookingDate as any
);

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("ExtendBookingDateDialog", () => {
  beforeEach(() => {
    render(
      <ExtendBookingDateDialog
        {...saul}
        extendedDate="2022-03-03"
        onClose={mockOnClose}
        onCloseAll={() => {}}
      />
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  test("should call onClose on cancel", () => {
    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("should dispatch 'extendBookingDate' with the customer id and the extended date provided", async () => {
    screen.getByText(i18n.t(ActionButton.ExtendBookingDate) as string).click();
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        mockExtendBookingDate(saul, "2022-03-03")
      );
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
