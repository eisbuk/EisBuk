/**
 * @jest-environment jsdom
 */

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Customer } from "@eisbuk/shared";
import i18n, { ActionButton } from "@eisbuk/translations";

import "@/__testSetup__/firestoreSetup";

import { SendBookingLinkMethod } from "@/enums/other";
import { Routes } from "@/enums/routes";

import CustomerCard from "../CustomerCard";

import * as customerActions from "@/store/actions/customerOperations";

import { saul } from "@/__testData__/customers";
import { __testOrganization__ } from "@/__testSetup__/envData";

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
      render(
        <CustomerCard
          onCloseAll={() => {}}
          onClose={() => {}}
          customer={saul}
          displayName={__testOrganization__}
        />
      );
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

    test("should open 'CustomerFormDialog' modal on edit click", () => {
      screen.getByTestId(__customerEditId__).click();
      expect(mockDispatch).toHaveBeenCalledWith(
        openModal({
          component: "CustomerFormDialog",
          props: { customer: saul },
        })
      );
    });
  });

  describe("Test email button", () => {
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
      expect(mockDispatch).toHaveBeenCalledWith(
        openModal({
          component: "SendBookingsLinkDialog",
          props: {
            ...saul,
            method: SendBookingLinkMethod.Email,
            displayName: __testOrganization__,
          },
        })
      );
    });

    test("should disable the button if secretKey not defined", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { secretKey, ...noSecretKeySaul } = saul;
      render(
        <CustomerCard
          onCloseAll={() => {}}
          onClose={() => {}}
          customer={noSecretKeySaul as Customer}
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

  describe("Test SMS button", () => {
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
      expect(mockDispatch).toHaveBeenCalledWith(
        openModal({
          component: "SendBookingsLinkDialog",
          props: {
            ...saul,
            method: SendBookingLinkMethod.SMS,
            displayName: __testOrganization__,
          },
        })
      );
    });

    test("should disable the button if secretKey not defined", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { secretKey, ...noSecretKeySaul } = saul;
      render(
        <CustomerCard
          onCloseAll={() => {}}
          onClose={() => {}}
          customer={noSecretKeySaul as Customer}
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
          customer={noPhoneSaul as Customer}
          displayName={__testOrganization__}
        />
      );
      expect(screen.getByTestId(__sendBookingsSMSId__)).toHaveProperty(
        "disabled",
        true
      );
    });
  });

  describe("Test bookings redirect button", () => {
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

  describe("Test booking extension button", () => {
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
      expect(mockDispatch).toHaveBeenCalledWith(
        openModal({ component: "ExtendBookingDateDialog", props: saul })
      );
    });
  });
});
