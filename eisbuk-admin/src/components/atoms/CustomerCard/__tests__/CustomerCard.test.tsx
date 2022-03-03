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

import { Customer } from "eisbuk-shared";

import "@/__testSetup__/firestoreSetup";

import { ActionButton, CustomerFormTitle, Prompt } from "@/enums/translations";
import { SendBookingLinkMethod } from "@/enums/other";
import { Routes } from "@/enums/routes";

import CustomerCard from "../CustomerCard";

import * as customerActions from "@/store/actions/customerOperations";

import i18n from "@/__testUtils__/i18n";

import { saul } from "@/__testData__/customers";
import {
  __customerDeleteId__,
  __customerEditId__,
  __openBookingsId__,
  __sendBookingsEmailId__,
  __sendBookingsSMSId__,
} from "../__testData__/testIds";

const mockDispatch = jest.fn();
const mockHistoryPush = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock("react-router-dom", () => ({
  useHistory: () => ({ push: mockHistoryPush }),
}));

/**
 * A mock implementation we're using to test dispatching of `deleteCustomer`
 * action. We're returning an action object, rather that annonymus thunk (not comparable)
 */
const mockDeleteCustomerImplementation = (payload: Customer) => ({
  type: "delete",
  payload,
});
/**
 * A mock implementation we're using to test dispatching of `updateCustomer`
 * action. We're returning an action object, rather that annonymus thunk (not comparable)
 */
const mockUpdateCustomerImplementation = (payload: Customer) => ({
  type: "update",
  payload,
});

jest
  .spyOn(customerActions, "deleteCustomer")
  .mockImplementation(mockDeleteCustomerImplementation as any);
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

    /** @TODO  cypress test */
    test("should dispatch 'deleteCustomer' after dialog confirmation", () => {
      screen.getByTestId(__customerDeleteId__).click();

      // check proper rendering of confirm delete dialog message
      screen.getByText(
        `${i18n.t(Prompt.DeleteCustomer)} ${saul.name} ${saul.surname}?`
      );
      // confirm deletion
      screen.getByText("Yes").click();
      expect(mockDispatch).toHaveBeenCalledWith(
        mockDeleteCustomerImplementation(saul)
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
    test("should call sendBookingsLink function on email button click, after confirming with the dialog, passing appropriate customer id and method", () => {
      // mock thunk creator to identity function for easier testing
      const sendMailSpy = jest
        .spyOn(customerActions, "sendBookingsLink")
        .mockImplementation((payload) => payload as any);
      render(<CustomerCard onClose={() => {}} customer={saul} />);
      screen.getByTestId(__sendBookingsEmailId__).click();
      // the function shouldn't be called before confirmation
      expect(sendMailSpy).not.toHaveBeenCalled();
      screen.getByText(i18n.t(Prompt.SendEmailTitle) as string);
      screen.getByText(
        i18n.t(Prompt.ConfirmEmail, { email: saul.email }) as string
      );
      screen.getByText("Yes").click();
      expect(mockDispatch).toHaveBeenCalledWith({
        bookingsLink: `https://localhost${Routes.CustomerArea}/${saul.secretKey}`,
        customerId: saul.id,
        method: SendBookingLinkMethod.Email,
      });
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
    test("should call sendBookingsLink function on sms button click, after confirming with the dialog, passing appropriate customer id and method", () => {
      // mock thunk creator to identity function for easier testing
      const sendBookingsSpy = jest
        .spyOn(customerActions, "sendBookingsLink")
        .mockImplementation((payload) => payload as any);
      render(<CustomerCard onClose={() => {}} customer={saul} />);
      screen.getByTestId(__sendBookingsSMSId__).click();
      // the function shouldn't be called before confirmation
      expect(sendBookingsSpy).not.toHaveBeenCalled();
      screen.getByText(i18n.t(Prompt.SendSMSTitle) as string);
      screen.getByText(
        i18n.t(Prompt.ConfirmSMS, { phone: saul.phone }) as string
      );
      screen.getByText("Yes").click();
      expect(mockDispatch).toHaveBeenCalledWith({
        bookingsLink: `https://localhost${Routes.CustomerArea}/${saul.secretKey}`,
        customerId: saul.id,
        method: SendBookingLinkMethod.SMS,
      });
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
      screen.getByText(
        i18n.t(Prompt.ExtendBookingDateTitle, {
          customer: `${saul.name} ${saul.surname}`,
        }) as string
      );
      screen.getByText(
        i18n.t(Prompt.ExtendBookingDateBody, {
          customer: `${saul.name} ${saul.surname}`,
        }) as string
      );
    });

    test("should call 'extendBookingDate' after typing in extended date", () => {
      const extendBookingDateSpy = jest
        .spyOn(customerActions, "extendBookingDate")
        .mockImplementation((() => {}) as any);
      render(<CustomerCard onClose={() => {}} customer={saul} />);
      screen
        .getByText(i18n.t(ActionButton.ExtendBookingDate) as string)
        .click();
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "2022-01-01" },
      });
      screen.getByText(/yes/i).click();
      expect(extendBookingDateSpy).toHaveBeenCalledWith(saul.id, "2022-01-01");
    });
  });
});
