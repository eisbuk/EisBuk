/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import { Customer } from "@eisbuk/shared";
import i18n, { ActionButton, CustomerFormTitle } from "@eisbuk/translations";

import "@/__testSetup__/firestoreSetup";

import { SendBookingLinkMethod } from "@/enums/other";
import { Routes } from "@/enums/routes";

import CustomerCard from "../CustomerCard";

import * as customerActions from "@/store/actions/customerOperations";

import { saul } from "@/__testData__/customers";
import {
  __customerDeleteId__,
  __customerEditId__,
  __openBookingsId__,
  __sendBookingsEmailId__,
  __sendBookingsSMSId__,
} from "../__testData__/testIds";
import { openModal } from "@/features/modal/actions";

const mockDispatch = jest.fn();
const mockHistoryPush = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock("react-router-dom", () => ({
  useHistory: () => ({ push: mockHistoryPush }),
}));

/**
 * A mock implementation we're using to test dispatching of `updateCustomer`
 * action. We're returning an action object, rather that annonymus thunk (not comparable)
 */
const mockUpdateCustomerImplementation = (payload: Customer) => ({
  type: "update",
  payload,
});

jest
  .spyOn(customerActions, "updateCustomer")
  .mockImplementation(mockUpdateCustomerImplementation as any);

describe("Customer Card", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("CustomerOperationButtons", () => {
    beforeEach(() => {
      render(<CustomerCard onClose={() => {}} customer={saul} />);
    });

    afterEach(() => {
      jest.clearAllMocks();
      cleanup();
    });

    test("should open 'DeleteCustomerDialog' modal on delete button click", () => {
      screen.getByTestId(__customerDeleteId__).click();
      expect(mockDispatch).toHaveBeenCalledWith(
        openModal({ component: "DeleteCustomerDialog", props: saul })
      );
    });

    test("should open 'CustomerForm' on edit click and dispatch 'updateCustomer' with updated values on submit", async () => {
      const newName = "Jimmy";
      const newSurname = "McGill";

      screen.getByTestId(__customerEditId__).click();
      // check proper rendering of confirm delete dialog message
      screen.getByText(
        `${i18n.t(CustomerFormTitle.EditCustomer)} (${saul.name} ${
          saul.surname
        })`
      );
      // update customer
      const [nameInput, surnameInput] = screen.getAllByRole("textbox");
      fireEvent.change(nameInput, { target: { value: newName } });
      fireEvent.change(surnameInput, { target: { value: newSurname } });
      // submit form
      screen.getByText(i18n.t(ActionButton.Save) as string).click();
      await waitFor(() =>
        expect(mockDispatch).toHaveBeenCalledWith(
          mockUpdateCustomerImplementation({
            ...saul,
            name: newName,
            surname: newSurname,
          })
        )
      );
    });
  });

  describe("Test email button", () => {
    test("should open a 'SendBookingsLinkDialog' modal with method = \"email\" on email button click", () => {
      render(<CustomerCard onClose={() => {}} customer={saul} />);
      screen.getByTestId(__sendBookingsEmailId__).click();
      expect(mockDispatch).toHaveBeenCalledWith(
        openModal({
          component: "SendBookingsLinkDialog",
          props: { ...saul, method: SendBookingLinkMethod.Email },
        })
      );
    });

    test("should disable the button if secretKey not defined", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { secretKey, ...noSecretKeySaul } = saul;
      render(
        <CustomerCard
          onClose={() => {}}
          customer={noSecretKeySaul as Customer}
        />
      );

      expect(screen.getByTestId(__sendBookingsEmailId__)).toHaveProperty(
        "disabled",
        true
      );
    });

    test("should disable the button if email is not provided", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, ...noEmailSaul } = saul;
      render(<CustomerCard onClose={() => {}} customer={noEmailSaul} />);
      expect(screen.getByTestId(__sendBookingsEmailId__)).toHaveProperty(
        "disabled",
        true
      );
    });
  });

  describe("Test SMS button", () => {
    test("should open a 'SendBookingsLinkDialog' modal with method = \"sms\" on sms button click", () => {
      render(<CustomerCard onClose={() => {}} customer={saul} />);
      screen.getByTestId(__sendBookingsSMSId__).click();
      expect(mockDispatch).toHaveBeenCalledWith(
        openModal({
          component: "SendBookingsLinkDialog",
          props: { ...saul, method: SendBookingLinkMethod.SMS },
        })
      );
    });

    test("should disable the button if secretKey not defined", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { secretKey, ...noSecretKeySaul } = saul;
      render(
        <CustomerCard
          onClose={() => {}}
          customer={noSecretKeySaul as Customer}
        />
      );

      expect(screen.getByTestId(__sendBookingsSMSId__)).toHaveProperty(
        "disabled",
        true
      );
    });

    test("should disable the button if phone is not provided", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { phone, ...noPhoneSaul } = saul;
      render(
        <CustomerCard onClose={() => {}} customer={noPhoneSaul as Customer} />
      );
      expect(screen.getByTestId(__sendBookingsSMSId__)).toHaveProperty(
        "disabled",
        true
      );
    });
  });

  describe("Test bookings redirect button", () => {
    test("should redirect to 'bookings' route for a customer on bookings button click", () => {
      render(<CustomerCard onClose={() => {}} customer={saul} />);
      screen.getByTestId(__openBookingsId__).click();
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `${Routes.CustomerArea}/${saul.secretKey}`
      );
    });
  });

  describe("Test booking extension button", () => {
    test("should open extend booking prompt on click 'extend booking date' button click", () => {
      render(<CustomerCard onClose={() => {}} customer={saul} />);
      screen
        .getByText(i18n.t(ActionButton.ExtendBookingDate) as string)
        .click();
      expect(mockDispatch).toHaveBeenCalledWith(
        openModal({ component: "ExtendBookingDateDialog", props: saul })
      );
    });
  });
});
