/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import i18n, {
  ActionButton,
  CustomerFormTitle,
  CustomerLabel,
} from "@eisbuk/translations";
import { Category, DeprecatedCategory } from "@eisbuk/shared";

import { CustomerForm } from "../index";

import { isoToDate } from "../../../utils/date";

import { saul } from "../__testData__";

const t = (...params: Parameters<typeof i18n.t>) => i18n.t(...params) as string;

describe("CustomerForm", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("Admin - edit customer - form", () => {
    const mockSave = jest.fn();
    const mockDelete = jest.fn();
    const mockCancel = jest.fn();
    const mockClose = jest.fn();

    beforeEach(() => {
      render(
        <CustomerForm.Admin
          customer={saul}
          onSave={mockSave}
          onDelete={mockDelete}
          onCancel={mockCancel}
          onClose={mockClose}
        />
      );
    });

    test("should render the appropriate title", () => {
      screen.getByText(
        t(CustomerFormTitle.AthleteProfile, {
          name: saul.name,
          surname: saul.surname,
        } as any)
      );
    });

    test("should render all the fields and enable toggling of edit mode", async () => {
      const categories = Object.values(Category);

      const formFields = [
        // Personal fields
        t(CustomerLabel.Name),
        t(CustomerLabel.Surname),
        t(CustomerLabel.Birthday),
        t(CustomerLabel.Email),
        t(CustomerLabel.Phone),

        // Medical fields
        t(CustomerLabel.CertificateExpiration),
        t(CustomerLabel.CovidCertificateReleaseDate),
        t(CustomerLabel.CovidCertificateSuspended),

        // Admin fields
        t(CustomerLabel.CardNumber),
      ] as string[];

      // Fields should be disabled as we're not in edit mode
      formFields.forEach((field) => {
        expect(screen.getByLabelText(field)).toHaveProperty("disabled", true);
      });
      // Category choices should also be disabled
      categories.forEach((category) => {
        expect(screen.getByLabelText(category)).toHaveProperty(
          "disabled",
          true
        );
      });

      // Toggle edit mode
      userEvent.click(screen.getByText(t(ActionButton.Edit)));

      // Fields should be enabled as we're in edit mode
      formFields.forEach((field) => {
        expect(screen.getByLabelText(field)).toHaveProperty("disabled", false);
      });
      // Category choices should also be enabled
      categories.forEach((category) => {
        expect(screen.getByLabelText(category)).toHaveProperty(
          "disabled",
          false
        );
      });
      // Deprecated categories, however, while shown, should be disabled
      Object.values(DeprecatedCategory).forEach((category) => {
        expect(screen.getByLabelText(category)).toHaveProperty(
          "disabled",
          true
        );
      });

      // Clicking cancel should disable the fields again
      userEvent.click(screen.getByText(t(ActionButton.Cancel)));
      formFields.forEach((field) => {
        expect(screen.getByLabelText(field)).toHaveProperty("disabled", true);
      });
      categories.forEach((category) => {
        expect(screen.getByLabelText(category)).toHaveProperty(
          "disabled",
          true
        );
      });

      // So should clicking save
      userEvent.click(screen.getByText(t(ActionButton.Edit)));
      userEvent.click(screen.getByText(t(ActionButton.Save)));
      // Formik's submit is async-ish in nature, so we need to wait for it to finish
      await waitFor(() => {
        formFields.forEach((field) => {
          expect(screen.getByLabelText(field)).toHaveProperty("disabled", true);
        });
        categories.forEach((category) => {
          expect(screen.getByLabelText(category)).toHaveProperty(
            "disabled",
            true
          );
        });
      });
    });

    test("should reset the form and call 'onCancel' on cancel button click", async () => {
      userEvent.click(screen.getByText(t(ActionButton.Edit)));

      // Edit one field to test it being reset
      const nameField = screen.getByLabelText(
        t(CustomerLabel.Name)
      ) as HTMLInputElement;
      userEvent.clear(nameField);
      userEvent.type(nameField, "Not saul");

      // Cancel the form
      await act(async () => {
        userEvent.click(screen.getByText(t(ActionButton.Cancel)));
      });
      expect(screen.getByLabelText(t(CustomerLabel.Name))).toHaveProperty(
        "value",
        saul.name
      );
      expect(mockCancel).toHaveBeenCalled();
    });

    test("should call onSave (and not reset the form) on save click", async () => {
      userEvent.click(screen.getByText(t(ActionButton.Edit)));

      // Edit one field to test it being reset
      const nameField = screen.getByLabelText(
        t(CustomerLabel.Name)
      ) as HTMLInputElement;
      userEvent.clear(nameField);
      userEvent.type(nameField, "Not saul");

      // Save the form
      userEvent.click(screen.getByText(t(ActionButton.Save)));
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });
      expect(mockSave.mock.calls[0][0]).toEqual({
        ...saul,
        name: "Not saul",
      });
    });

    test("should call 'onClose' on 'back' button click", () => {
      userEvent.click(screen.getByText(t(ActionButton.Back)));
      expect(mockClose).toHaveBeenCalled();
    });

    test("should call 'onDelete' and 'onClise' on 'delete' button click", () => {
      userEvent.click(screen.getByText(t(ActionButton.DeleteCustomer)));
      expect(mockDelete).toHaveBeenCalled();
    });

    test("should update form values on prop update", () => {
      cleanup();

      const { rerender } = render(
        <CustomerForm.Admin customer={saul} onSave={mockSave} />
      );

      // Update props
      const updatedSaul = {
        ...saul,
        name: "Updated name",
        surname: "Updated surname",
      };
      rerender(<CustomerForm.Admin customer={updatedSaul} onSave={mockSave} />);

      // Check that the form has been updated
      expect(screen.getByLabelText(t(CustomerLabel.Name))).toHaveProperty(
        "value",
        updatedSaul.name
      );
      expect(screen.getByLabelText(t(CustomerLabel.Surname))).toHaveProperty(
        "value",
        updatedSaul.surname
      );
    });
  });

  describe("Admin - edit customer - extended booking date", () => {
    // Extended booking date field should be "detatched" from the main form
    test("should render extended booking date, with field disabled in both edit and view mode", () => {
      render(<CustomerForm.Admin customer={saul} />);
      const extendedBookingDateField = screen.getByLabelText(
        t(CustomerLabel.ExtendedBookingDate)
      );
      expect(extendedBookingDateField).toHaveProperty("disabled", true);

      userEvent.click(screen.getByText(t(ActionButton.Edit)));
      expect(extendedBookingDateField).toHaveProperty("disabled", true);
    });

    test("should enable extended booking date field on 'extend booking date' button click and disable if the rest of the form is not disabled", async () => {
      render(<CustomerForm.Admin customer={saul} />);
      expect(
        screen.getByLabelText(t(CustomerLabel.ExtendedBookingDate))
      ).toHaveProperty("disabled", true);
      userEvent.click(screen.getByText(t(ActionButton.ExtendBookingDate)));
      // The old component was detached from the DOM, so we need to re-query
      expect(
        screen.getByLabelText(t(CustomerLabel.ExtendedBookingDate))
      ).toHaveProperty("disabled", false);
    });

    test("should disable (and reset) the extended booking date field when the form is enabled", () => {
      render(<CustomerForm.Admin customer={saul} />);
      let extendedBookingDateField = screen.getByLabelText(
        t(CustomerLabel.ExtendedBookingDate)
      );

      // Enable and edit the extended booking date field
      userEvent.click(screen.getByText(t(ActionButton.ExtendBookingDate)));
      userEvent.clear(extendedBookingDateField);
      userEvent.type(extendedBookingDateField, "02/02/2022");

      // Enabling the form should disable and reset the extended booking date field
      userEvent.click(screen.getByText(t(ActionButton.Edit)));
      // The old component was detached from the dom, so we need to re-query
      extendedBookingDateField = screen.getByLabelText(
        t(CustomerLabel.ExtendedBookingDate)
      );
      expect(extendedBookingDateField).toHaveProperty("disabled", true);
      expect(extendedBookingDateField).toHaveProperty(
        "value",
        isoToDate(saul.extendedDate!)
      );
      // If the form is enabled, the 'extend booking date' button should be disabled
      expect(
        // The button has a span inside it, so we need to get the parent
        screen.getByText(t(ActionButton.ExtendBookingDate)).parentElement
      ).toHaveProperty("disabled", true);
    });

    test("should disable (and reset) the extended booking date field on cancel button click", async () => {
      render(<CustomerForm.Admin customer={saul} />);
      const extendedBookingDateField = screen.getByLabelText(
        t(CustomerLabel.ExtendedBookingDate)
      );

      // Enable and edit the extended booking date field
      userEvent.click(screen.getByText(t(ActionButton.ExtendBookingDate)));
      userEvent.clear(extendedBookingDateField);
      userEvent.type(extendedBookingDateField, "02/02/2022");

      // Canceling the form should disable and reset the extended booking date field
      await act(async () => {
        userEvent.click(screen.getByText(t(ActionButton.Cancel)));
      });
      expect(extendedBookingDateField).toHaveProperty("disabled", true);
      await waitFor(() => {
        expect(extendedBookingDateField).toHaveProperty(
          "value",
          isoToDate(saul.extendedDate!)
        );
      });
    });

    test("should update the extended booking date if the value is updated from outside the form", () => {
      const { rerender } = render(<CustomerForm.Admin customer={saul} />);
      const updatedSaul = {
        ...saul,
        extendedDate: "2022-02-02",
      };
      rerender(<CustomerForm.Admin customer={updatedSaul} />);
      expect(
        screen.getByLabelText(t(CustomerLabel.ExtendedBookingDate))
      ).toHaveProperty("value", isoToDate(updatedSaul.extendedDate));
    });

    test("should call 'onBookingDateExtended' when new extended date saved", async () => {
      const mockBookingDateExtended = jest.fn();
      render(
        <CustomerForm.Admin
          customer={saul}
          onBookingDateExtended={mockBookingDateExtended}
        />
      );
      userEvent.click(screen.getByText(t(ActionButton.ExtendBookingDate)));
      const extendedBookingDateField = screen.getByLabelText(
        t(CustomerLabel.ExtendedBookingDate)
      );

      userEvent.clear(extendedBookingDateField);
      userEvent.type(extendedBookingDateField, "02/02/2022");
      userEvent.click(screen.getByText(t(ActionButton.Save)));

      await waitFor(() => {
        expect(mockBookingDateExtended).toHaveBeenCalledWith("2022-02-02");
      });
    });

    test("should disable and reset the field on save (the field should then get updated when the whole round of updates is applied)", async () => {
      render(<CustomerForm.Admin customer={saul} />);
      userEvent.click(screen.getByText(t(ActionButton.ExtendBookingDate)));
      const extendedBookingDateField = screen.getByLabelText(
        t(CustomerLabel.ExtendedBookingDate)
      );

      userEvent.clear(extendedBookingDateField);
      userEvent.type(extendedBookingDateField, "02/02/2022");
      userEvent.click(screen.getByText(t(ActionButton.Save)));

      await waitFor(() => {
        expect(
          screen.getByLabelText(t(CustomerLabel.ExtendedBookingDate))
        ).toHaveProperty("value", isoToDate(saul.extendedDate!));
      });
    });
  });

  describe("Admin - new customer - form", () => {
    test("should render an appropriate title", () => {
      render(<CustomerForm.Admin />);
      screen.getByText(t(CustomerFormTitle.NewCustomer));
    });

    test("should render the fields with form enabled (we've nothing to show if the form is disabled)", async () => {
      render(<CustomerForm.Admin />);
      const requiredFields = [
        // Personal fields
        t(CustomerLabel.Name),
        t(CustomerLabel.Surname),
        t(CustomerLabel.Birthday),
        t(CustomerLabel.Email),
        t(CustomerLabel.Phone),

        // Medical fields
        t(CustomerLabel.CertificateExpiration),
        t(CustomerLabel.CovidCertificateReleaseDate),
        t(CustomerLabel.CovidCertificateSuspended),

        // Admin fields
        t(CustomerLabel.CardNumber),
      ] as string[];

      // Fields should be enabled as we're in edit mode
      requiredFields.forEach((field) => {
        expect(screen.getByLabelText(field)).toHaveProperty("disabled", false);
      });
    });

    test("should pass subscription number to the 'subscriptionNumber' field if one received from props", () => {
      render(<CustomerForm.Admin subscriptionNumber="123" />);
      expect(screen.getByLabelText(t(CustomerLabel.CardNumber))).toHaveProperty(
        "value",
        "123"
      );
    });

    test("should call 'onClose' on both 'back' and 'cancel' button clicks", () => {
      const mockClose = jest.fn();
      render(<CustomerForm.Admin onClose={mockClose} />);
      userEvent.click(screen.getByText(t(ActionButton.Back)));
      expect(mockClose).toHaveBeenCalled();
      userEvent.click(screen.getByText(t(ActionButton.Cancel)));
      expect(mockClose).toHaveBeenCalledTimes(2);
    });

    test("should call 'onSave' on save button click and close the form if the submission is successful", async () => {
      const mockSave = jest.fn();
      const mockClose = jest.fn();
      render(<CustomerForm.Admin onSave={mockSave} onClose={mockClose} />);

      // Fill out the mimimal fields
      const nameField = screen.getByLabelText(
        t(CustomerLabel.Name)
      ) as HTMLInputElement;
      userEvent.type(nameField, "Saul");
      const surnameField = screen.getByLabelText(
        t(CustomerLabel.Surname)
      ) as HTMLInputElement;
      userEvent.type(surnameField, "Goodman");
      const subscriptionNumberField = screen.getByLabelText(
        t(CustomerLabel.CardNumber)
      ) as HTMLInputElement;
      userEvent.type(subscriptionNumberField, "12345");
      const competitiveCategoryField = screen.getByLabelText(
        t(Category.Competitive)
      ) as HTMLInputElement;
      userEvent.click(competitiveCategoryField);

      userEvent.click(screen.getByText(t(ActionButton.Save)));
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled();
      });
    });

    test("should not render additional actions (as customer doesn't exist", () => {
      render(<CustomerForm.Admin />);
      expect(
        screen.queryByLabelText(t(CustomerLabel.ExtendedBookingDate))
      ).toBeFalsy();
      expect(screen.queryByText(t(ActionButton.ExtendBookingDate))).toBeFalsy();
      expect(screen.queryByText(t(ActionButton.DeleteCustomer))).toBeFalsy();
    });
  });
});
