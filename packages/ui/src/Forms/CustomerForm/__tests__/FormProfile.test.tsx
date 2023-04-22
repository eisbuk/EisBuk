import React from "react";
import { vi, expect, test, describe } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import i18n, { ActionButton, CustomerLabel } from "@eisbuk/translations";

import { CustomerForm } from "../index";

import { saul } from "@eisbuk/test-data/customers";

describe("CustomerForm", () => {
  describe("Profile", () => {
    test("should render all the fields and enable toggling of edit mode", async () => {
      render(<CustomerForm.Profile customer={saul} />);
      const requiredFields = [
        // Personal fields
        i18n.t(CustomerLabel.Name),
        i18n.t(CustomerLabel.Surname),
        i18n.t(CustomerLabel.Birthday),
        i18n.t(CustomerLabel.Email),
        i18n.t(CustomerLabel.Phone),

        // Medical fields
        i18n.t(CustomerLabel.CertificateExpiration),
        i18n.t(CustomerLabel.CovidCertificateReleaseDate),
        i18n.t(CustomerLabel.CovidCertificateSuspended),
      ] as string[];

      // Fields should be disabled as we're not in edit mode
      requiredFields.forEach((field) => {
        expect(screen.getByLabelText(field)).toHaveProperty("disabled", true);
      });

      // Toggle edit mode
      userEvent.click(screen.getByText(i18n.t(ActionButton.Edit) as string));

      // Fields should be enabled as we're in edit mode
      requiredFields.forEach((field) => {
        expect(screen.getByLabelText(field)).toHaveProperty("disabled", false);
      });

      // Clicking cancel should disable the fields again
      userEvent.click(screen.getByText(i18n.t(ActionButton.Cancel) as string));
      requiredFields.forEach((field) => {
        expect(screen.getByLabelText(field)).toHaveProperty("disabled", true);
      });

      // So should clicking save
      userEvent.click(screen.getByText(i18n.t(ActionButton.Edit) as string));
      userEvent.click(screen.getByText(i18n.t(ActionButton.Save) as string));
      // Formik's submit is async-ish in nature, so we need to wait for it to finish
      await waitFor(() =>
        requiredFields.forEach((field) => {
          expect(screen.getByLabelText(field)).toHaveProperty("disabled", true);
        })
      );
    });

    test("should reset the form and call 'onCancel' on cancel button click", async () => {
      const mockCancel = vi.fn();
      render(<CustomerForm.Profile customer={saul} onCancel={mockCancel} />);
      userEvent.click(screen.getByText(i18n.t(ActionButton.Edit) as string));

      // Edit one field to test it being reset
      const nameField = screen.getByLabelText(
        i18n.t(CustomerLabel.Name) as string
      ) as HTMLInputElement;
      await act(async () => {
        userEvent.clear(nameField);
        userEvent.type(nameField, "Not saul");
      });

      // Cancel the form
      await act(async () => {
        userEvent.click(
          screen.getByText(i18n.t(ActionButton.Cancel) as string)
        );
      });
      expect(
        screen.getByLabelText(i18n.t(CustomerLabel.Name) as string)
      ).toHaveProperty("value", saul.name);
      expect(mockCancel).toHaveBeenCalled();
    });

    test("should call onSave (and not reset the form) on save click", async () => {
      const mockSave = vi.fn();
      render(<CustomerForm.Profile customer={saul} onSave={mockSave} />);
      userEvent.click(screen.getByText(i18n.t(ActionButton.Edit) as string));

      const nameField = screen.getByLabelText(
        i18n.t(CustomerLabel.Name) as string
      ) as HTMLInputElement;
      userEvent.clear(nameField);
      userEvent.type(nameField, "Not saul");

      // Save the form
      userEvent.click(screen.getByText(i18n.t(ActionButton.Save) as string));
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          {
            ...saul,
            name: "Not saul",
          },
          expect.objectContaining({})
        );
      });
    });
  });
});
