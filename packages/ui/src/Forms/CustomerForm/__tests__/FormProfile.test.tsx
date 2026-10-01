import React from "react";
import { vi, expect, test, describe } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTime } from "luxon";

import i18n, { ActionButton, CustomerLabel } from "@eisbuk/translations";

import { CustomerForm } from "../index";

import { isoToDate } from "../../../utils/date";

import { saul } from "@eisbuk/testing/customers";

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
      ] as string[];
      // Managed by club admins only (#955): never editable by the athlete
      const certificateField = screen.getByLabelText(
        i18n.t(CustomerLabel.CertificateExpiration) as string,
      );

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
      expect((certificateField as HTMLInputElement).disabled).toEqual(true);

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
        }),
      );
    });

    test("should reset the form and call 'onCancel' on cancel button click", async () => {
      const mockCancel = vi.fn();
      render(<CustomerForm.Profile customer={saul} onCancel={mockCancel} />);
      userEvent.click(screen.getByText(i18n.t(ActionButton.Edit) as string));

      // Edit one field to test it being reset
      const nameField = screen.getByLabelText(
        i18n.t(CustomerLabel.Name) as string,
      ) as HTMLInputElement;
      await act(async () => {
        userEvent.clear(nameField);
        userEvent.type(nameField, "Not saul");
      });

      // Cancel the form
      await act(async () => {
        userEvent.click(
          screen.getByText(i18n.t(ActionButton.Cancel) as string),
        );
      });
      expect(
        screen.getByLabelText(i18n.t(CustomerLabel.Name) as string),
      ).toHaveProperty("value", saul.name);
      expect(mockCancel).toHaveBeenCalled();
    });

    test("should call onSave (and not reset the form) on save click", async () => {
      const mockSave = vi.fn();
      render(<CustomerForm.Profile customer={saul} onSave={mockSave} />);
      userEvent.click(screen.getByText(i18n.t(ActionButton.Edit) as string));

      const nameField = screen.getByLabelText(
        i18n.t(CustomerLabel.Name) as string,
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
          expect.objectContaining({}),
        );
      });
    });

    test("should trim string fields when calling onSave", async () => {
      const mockSave = vi.fn();
      render(<CustomerForm.Profile customer={saul} onSave={mockSave} />);
      userEvent.click(screen.getByText(i18n.t(ActionButton.Edit) as string));

      const nameField = screen.getByLabelText(
        i18n.t(CustomerLabel.Name) as string,
      ) as HTMLInputElement;
      userEvent.clear(nameField);
      userEvent.type(nameField, "Jimmy ");

      const surnameField = screen.getByLabelText(
        i18n.t(CustomerLabel.Surname) as string,
      ) as HTMLInputElement;
      userEvent.clear(surnameField);
      userEvent.type(surnameField, " McGill");

      // Save the form
      userEvent.click(screen.getByText(i18n.t(ActionButton.Save) as string));
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          {
            ...saul,
            name: "Jimmy",
            surname: "McGill",
          },
          expect.objectContaining({}),
        );
      });
    });
  });

  describe("Profile - certificate expiration (#955)", () => {
    const getCertificateField = () =>
      screen.getByLabelText(
        i18n.t(CustomerLabel.CertificateExpiration) as string,
      ) as HTMLInputElement;
    const expired = () =>
      screen.queryByText(i18n.t(CustomerLabel.CertificateExpired) as string);
    const missing = () =>
      screen.queryByText(i18n.t(CustomerLabel.CertificateMissing) as string);

    test("should show the date, read-only, explaining that the club manages it", () => {
      render(
        <CustomerForm.Profile
          customer={{ ...saul, certificateExpiration: "2099-12-31" }}
        />,
      );
      userEvent.click(screen.getByText(i18n.t(ActionButton.Edit) as string));

      expect(getCertificateField().value).toEqual(isoToDate("2099-12-31"));
      expect(getCertificateField().disabled).toEqual(true);
      screen.getByText(
        i18n.t(CustomerLabel.CertificateManagedByAdmins) as string,
      );
      // A valid certificate gets no warning
      expect(expired()).toBeNull();
      expect(missing()).toBeNull();
    });

    test("should treat a certificate expiring today as still valid", () => {
      const today = DateTime.now().toISODate();
      render(
        <CustomerForm.Profile
          customer={{ ...saul, certificateExpiration: today }}
        />,
      );
      expect(expired()).toBeNull();
    });

    test("should flag an expired certificate", () => {
      const yesterday = DateTime.now().minus({ days: 1 }).toISODate();
      render(
        <CustomerForm.Profile
          customer={{ ...saul, certificateExpiration: yesterday }}
        />,
      );
      expect(getCertificateField().value).toEqual(isoToDate(yesterday));
      expect(expired()).not.toBeNull();
    });

    test("should flag a malformed certificate date, even one that looks like a future date", () => {
      // Sorts after today as a string, but isn't a valid date
      render(
        <CustomerForm.Profile
          customer={{ ...saul, certificateExpiration: "2099-02-31" }}
        />,
      );
      expect(
        screen.queryByText(i18n.t(CustomerLabel.CertificateInvalid) as string),
      ).not.toBeNull();
      expect(expired()).toBeNull();
      expect(missing()).toBeNull();
    });

    test("should save personal details even if the stored certificate date is malformed", async () => {
      const mockSave = vi.fn();
      // Not a valid date (stored through the old callable, or the rules' loose regex)
      render(
        <CustomerForm.Profile
          customer={{ ...saul, certificateExpiration: "2026-02-31" }}
          onSave={mockSave}
        />,
      );
      userEvent.click(screen.getByText(i18n.t(ActionButton.Edit) as string));

      const nameField = screen.getByLabelText(
        i18n.t(CustomerLabel.Name) as string,
      ) as HTMLInputElement;
      userEvent.clear(nameField);
      userEvent.type(nameField, "Jimmy");

      userEvent.click(screen.getByText(i18n.t(ActionButton.Save) as string));
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Jimmy" }),
          expect.objectContaining({}),
        );
      });
    });

    test("should flag a missing certificate", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { certificateExpiration, ...saulNoCertificate } = saul;
      render(<CustomerForm.Profile customer={saulNoCertificate} />);
      expect(getCertificateField().value).toEqual("");
      expect(missing()).not.toBeNull();
    });
  });
});
