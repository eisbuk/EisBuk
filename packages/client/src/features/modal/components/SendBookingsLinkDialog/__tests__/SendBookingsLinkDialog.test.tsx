/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render } from "@testing-library/react";
import * as reactRedux from "react-redux";

import i18n, { ActionButton } from "@eisbuk/translations";

import { SendBookingLinkMethod } from "@/enums/other";

import SendBookingsLinkDialog from "../SendBookingsLinkDialog";
import * as utils from "../utils";

import { saul } from "@/__testData__/customers";

const displayName = "organization";
const mockOnClose = jest.fn();
// Mock sendBookingsLink to a, sort of, identity function
// to test it being dispatched to the store (with appropriate params)
// rather than just being called
const mockSendBookingsLink = (params: any) => ({
  ...params,
  type: "sendBookingsLink",
});
jest
  .spyOn(utils, "sendBookingsLink")
  .mockImplementation(mockSendBookingsLink as any);

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: () => mockSelector,
}));
const mockSelector = jest.spyOn(reactRedux, "useSelector");
mockSelector.mockImplementation(() => displayName);

// Bookings link we'll receive from 'getBookingsLink()' inside the component
// host -> 'localhost' (we're in jest-environment jsdom)
// secretKey -> saul's secret key (we're using saul as a test customer in all tests below)
const testBookingsLink = `https://localhost/customer_area/${saul.secretKey}`;

describe("SendBookingsLinkDialog", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should call onClose on cancel", () => {
    render(
      <SendBookingsLinkDialog
        onCloseAll={() => {}}
        {...saul}
        method={SendBookingLinkMethod.Email}
        onClose={mockOnClose}
      />
    );
    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("should call onClose on cancel", () => {
    render(
      <SendBookingsLinkDialog
        onCloseAll={() => {}}
        {...saul}
        method={SendBookingLinkMethod.Email}
        onClose={mockOnClose}
      />
    );
    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("should call 'sendBookingsLink' with 'email' method if method = \"email\" and close the modal", () => {
    render(
      <SendBookingsLinkDialog
        onCloseAll={() => {}}
        {...saul}
        method={SendBookingLinkMethod.Email}
        onClose={mockOnClose}
      />
    );
    screen.getByText(i18n.t(ActionButton.Send) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      mockSendBookingsLink({
        ...saul,
        method: SendBookingLinkMethod.Email,
        bookingsLink: testBookingsLink,
        displayName,
      })
    );
  });

  test("should call 'sendBookingsLink' with 'sms' method if method = \"sms\" and close the modal", () => {
    render(
      <SendBookingsLinkDialog
        onCloseAll={() => {}}
        {...saul}
        method={SendBookingLinkMethod.SMS}
        onClose={mockOnClose}
      />
    );
    screen.getByText(i18n.t(ActionButton.Send) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      mockSendBookingsLink({
        ...saul,
        method: SendBookingLinkMethod.SMS,
        bookingsLink: testBookingsLink,
        displayName,
      })
    );
  });
});
