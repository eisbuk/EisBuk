/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Customer, CustomerFull } from "@eisbuk/shared";
import i18n, { ActionButton } from "@eisbuk/translations";

import "@/__testSetup__/firestoreSetup";
import { __testOrganization__ } from "@/__testSetup__/envData";

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("CustomerOperationButtons", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      render(
        <CustomerCard
          onCloseAll={() => {}}
          onClose={() => {}}
          customer={saul}
          displayName={__testOrganization__}
        />
      );
    });

    test("should open 'DeleteCustomerDialog' modal on delete button click", () => {
      screen.getByTestId(__customerDeleteId__).click();
      const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
      expect(dispatchCallPayload.component).toEqual("DeleteCustomerDialog");
      expect(dispatchCallPayload.props).toEqual(saul);
    });

    test("should open 'CustomerFormDialog' modal on edit click", () => {
      screen.getByTestId(__customerEditId__).click();
      const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
      expect(dispatchCallPayload.component).toEqual("CustomerFormDialog");
      expect(dispatchCallPayload.props).toEqual({ customer: saul });
    });
  });

  describe("test email button", () => {
    test("should open a 'SendBookingsLinkDialog' modal with method = \"email\" on email button click", () => {
      render(
        <CustomerCard
          onCloseAll={() => {}}
          onClose={() => {}}
          customer={saul}
          displayName={__testOrganization__}
        />
      );
      screen.getByTestId(__sendBookingsEmailId__).click();
      const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
      expect(dispatchCallPayload.component).toEqual("SendBookingsLinkDialog");
      expect(dispatchCallPayload.props).toEqual({
        ...saul,
        method: SendBookingLinkMethod.Email,
        displayName: __testOrganization__,
      });
    });

    test("should disable the button if secretKey not defined", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { secretKey, ...noSecretKeySaul } = saul;
      render(
        <CustomerCard
          onCloseAll={() => {}}
          onClose={() => {}}
          customer={noSecretKeySaul as CustomerFull}
          displayName={__testOrganization__}
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
      render(
        <CustomerCard
          onCloseAll={() => {}}
          onClose={() => {}}
          customer={noEmailSaul}
          displayName={__testOrganization__}
        />
      );
      expect(screen.getByTestId(__sendBookingsEmailId__)).toHaveProperty(
        "disabled",
        true
      );
    });
  });

  describe("test SMS button", () => {
    test("should open a 'SendBookingsLinkDialog' modal with method = \"sms\" on sms button click", () => {
      render(
        <CustomerCard
          onCloseAll={() => {}}
          onClose={() => {}}
          customer={saul}
          displayName={__testOrganization__}
        />
      );
      screen.getByTestId(__sendBookingsSMSId__).click();
      const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
      expect(dispatchCallPayload.component).toEqual("SendBookingsLinkDialog");
      expect(dispatchCallPayload.props).toEqual({
        ...saul,
        method: SendBookingLinkMethod.SMS,
        displayName: __testOrganization__,
      });
    });

    test("should disable the button if secretKey not defined", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { secretKey, ...noSecretKeySaul } = saul;
      render(
        <CustomerCard
          onCloseAll={() => {}}
          onClose={() => {}}
          customer={noSecretKeySaul as CustomerFull}
          displayName={__testOrganization__}
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
        <CustomerCard
          onCloseAll={() => {}}
          onClose={() => {}}
          customer={noPhoneSaul as CustomerFull}
          displayName={__testOrganization__}
        />
      );
      expect(screen.getByTestId(__sendBookingsSMSId__)).toHaveProperty(
        "disabled",
        true
      );
    });
  });

  describe("test bookings redirect button", () => {
    test("should redirect to 'bookings' route for a customer on bookings button click", () => {
      const mockOnClose = jest.fn();
      render(
        <CustomerCard
          onCloseAll={() => {}}
          onClose={mockOnClose}
          customer={saul}
          displayName={__testOrganization__}
        />
      );
      screen.getByTestId(__openBookingsId__).click();
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `${Routes.CustomerArea}/${saul.secretKey}`
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("test booking extension button", () => {
    test("should open extend booking prompt on click 'extend booking date' button click", () => {
      render(
        <CustomerCard
          onCloseAll={() => {}}
          onClose={() => {}}
          customer={saul}
          displayName={__testOrganization__}
        />
      );
      screen
        .getByText(i18n.t(ActionButton.ExtendBookingDate) as string)
        .click();
      const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
      expect(dispatchCallPayload.component).toEqual("ExtendBookingDateDialog");
      expect(dispatchCallPayload.props).toEqual(saul);
    });
  });
});
