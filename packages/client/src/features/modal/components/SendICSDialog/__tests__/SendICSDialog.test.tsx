/**
 * @vitest-environment jsdom
 */

import { describe, vi, expect, test, afterEach, beforeEach } from "vitest";
import React from "react";
import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import i18n, { ActionButton } from "@eisbuk/translations";

import { testId } from "@eisbuk/testing/testIds";

import SendICSDialog from "../SendICSDialog";

import * as icsOperations from "@/store/actions/icsCalendarOperations";

import { saul } from "@eisbuk/testing/customers";

vi.spyOn(icsOperations, "sendBookingsCalendar")
  // Mock the thunk to, instead of returning the thunk to the caller (redux dispatch),
  // return the parameters it was called with, so we can assert on them.
  .mockImplementation((...params: any[]) => params as any);

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
  ...vi.importActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

const mockOnClose = vi.fn();

describe("SendICSDialog", () => {
  describe("ICS File Email Test", () => {
    beforeEach(() => {
      render(
        <SendICSDialog
          email={saul.email}
          secretKey={saul.secretKey}
          onClose={mockOnClose}
          onCloseAll={mockOnClose}
          onUpdateSelf={() => {}}
        />
      );
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    test("should close the modal on cancel", () => {
      screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
      expect(mockOnClose).toHaveBeenCalled();
    });

    test("should send the ICS file to the email provided", async () => {
      const email = "test-email@email.com";

      const emailInput = screen.getByTestId(testId("input-dialog-email-input"));
      userEvent.clear(emailInput);
      userEvent.type(emailInput, email);

      screen.getByText(i18n.t(ActionButton.Send) as string).click();

      await waitFor(() =>
        expect(mockDispatch).toHaveBeenCalledWith([saul.secretKey, email])
      );
    });

    test("should send the ICS file to customer's email, if no email provided", async () => {
      screen.getByText(i18n.t(ActionButton.Send) as string).click();

      await waitFor(() =>
        expect(mockDispatch).toHaveBeenCalledWith([saul.secretKey, saul.email])
      );
    });
  });
});
