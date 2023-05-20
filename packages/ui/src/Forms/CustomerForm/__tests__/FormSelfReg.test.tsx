import React from "react";
import { vi, afterEach, expect, test, describe } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import i18n, { ActionButton, CustomerLabel } from "@eisbuk/translations";

import { CustomerForm } from "../index";

import { saul } from "@eisbuk/testing/customers";

describe("CustomerForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("SelfReg", () => {
    test("should render all the fields in always-edit mode", async () => {
      render(<CustomerForm.SelfReg customer={{ email: saul.email }} />);
      const requiredFields = [
        // Personal fields
        i18n.t(CustomerLabel.Name),
        i18n.t(CustomerLabel.Surname),
        i18n.t(CustomerLabel.Birthday),

        // We're missing email and phone fields. Those are tested below for slightly different behaviour.

        // Medical fields
        i18n.t(CustomerLabel.CertificateExpiration),
        i18n.t(CustomerLabel.CovidCertificateReleaseDate),
        i18n.t(CustomerLabel.CovidCertificateSuspended),
      ] as string[];

      // All (standard) fields should be enabled
      requiredFields.forEach((field) => {
        expect(screen.getByLabelText(field)).toHaveProperty("disabled", false);
      });

      // There should be no edit button
      expect(
        screen.queryByText(i18n.t(ActionButton.Edit) as string)
      ).toBeFalsy();

      // Fields should remain enabled after clicking save
      await act(async () => {
        userEvent.click(screen.getByText(i18n.t(ActionButton.Save) as string));
      });
      requiredFields.forEach((field) => {
        expect(screen.getByLabelText(field)).toHaveProperty("disabled", false);
      });

      // Fields should remain enabled after clicking cancel
      await act(async () => {
        userEvent.click(
          screen.getByText(i18n.t(ActionButton.Cancel) as string)
        );
      });
      requiredFields.forEach((field) => {
        expect(screen.getByLabelText(field)).toHaveProperty("disabled", false);
      });
    });

    test("should reset the form and call 'onCancel' on cancel button click", async () => {
      const mockCancel = vi.fn();
      render(
        <CustomerForm.SelfReg
          customer={{ email: saul.email }}
          onCancel={mockCancel}
        />
      );

      // Edit a field to test it being reset
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
    });

    test("should disable 'email' or 'phone' if respective field provided (during registration)", () => {
      render(<CustomerForm.SelfReg customer={{ email: saul.email }} />);
      expect(
        screen.getByLabelText(i18n.t(CustomerLabel.Email) as string)
      ).toHaveProperty("disabled", true);
      expect(
        screen.getByLabelText(i18n.t(CustomerLabel.Phone) as string)
      ).toHaveProperty("disabled", false);

      cleanup();

      render(<CustomerForm.SelfReg customer={{ phone: saul.phone }} />);
      expect(
        screen.getByLabelText(i18n.t(CustomerLabel.Email) as string)
      ).toHaveProperty("disabled", false);
      expect(
        screen.getByLabelText(i18n.t(CustomerLabel.Phone) as string)
      ).toHaveProperty("disabled", true);
    });

    test.only("should call onSave on save click", async () => {
      const mockSave = vi.fn();
      render(
        <CustomerForm.SelfReg
          customer={{ email: saul.email }}
          onSave={mockSave}
        />
      );

      // Fill out the minimal fields
      userEvent.type(
        screen.getByLabelText(i18n.t(CustomerLabel.Name) as string),
        "Saul"
      );
      userEvent.type(
        screen.getByLabelText(i18n.t(CustomerLabel.Surname) as string),
        "Goodman"
      );
      userEvent.type(
        screen.getByLabelText(i18n.t(CustomerLabel.RegistrationCode) as string),
        "CODE111"
      );

      // Save the form
      userEvent.click(screen.getByText(i18n.t(ActionButton.Save) as string));
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Saul",
            surname: "Goodman",
            email: saul.email,
          }),
          expect.objectContaining({})
        );
      });
    });
  });
});
