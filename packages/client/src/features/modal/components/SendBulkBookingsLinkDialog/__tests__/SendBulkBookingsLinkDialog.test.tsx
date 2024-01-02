/**
 * @vitest-environment jsdom
 */

import { describe, vi, expect, test, afterEach } from "vitest";
import React from "react";
import { screen, render } from "@testing-library/react";
import {
  ClientMessageType,
  defaultEmailTemplates as emailTemplates,
  ClientMessageMethod,
  OrganizationData,
} from "@eisbuk/shared";
import i18n, { ActionButton } from "@eisbuk/translations";

import SendBulkBookingsLinkDialog from "../SendBulkBookingsLinkDialog";
import * as orgOperations from "@/store/actions/organizationOperations";

import * as utils from "../../SendBookingsLinkDialog/utils";

import { saul } from "@eisbuk/testing/customers";
import { FormikHelpers } from "formik";
import { DateTime } from "luxon";

const mockOnClose = vi.fn();
// Mock sendBookingsLink to a, sort of, identity function
// to test it being dispatched to the store (with appropriate params)
// rather than just being called
const mockSendBookingsLink = (params: any) => ({
  ...params,
  type: "sendBookingsLink",
});
const mockUpdateOrganization = (params: any) => ({ ...params });
vi.spyOn(utils, "sendBookingsLink").mockImplementation(
  mockSendBookingsLink as any
);
vi.spyOn(orgOperations, "updateOrganization").mockImplementation(
  mockUpdateOrganization as any
);

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

const orgData = {
  admins: [],

  emailTemplates: {
    [ClientMessageType.SendBookingsLink]:
      emailTemplates[ClientMessageType.SendBookingsLink],
  },

  smtpConfigured: true,
  smsTemplates: { "": "" },
};

const testDate = DateTime.fromISO("2021-03-01");

// Bookings link we'll receive from 'getBookingsLink()' inside the component
// host -> 'localhost' (we're in vitest-environment jsdom)
// secretKey -> saul's secret key (we're using saul as a test customer in all tests below)
const testBookingsLink = `https://localhost:3000/customer_area/${saul.secretKey}`;

describe("SendBulkBookingsLinkDialog", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should call onClose on cancel", () => {
    render(
      <SendBulkBookingsLinkDialog
        onCloseAll={() => {}}
        customers={[saul]}
        method={ClientMessageMethod.Email}
        onClose={mockOnClose}
        orgData={orgData}
        actions={
          {
            setSubmitting: () => {},
          } as unknown as FormikHelpers<OrganizationData>
        }
        calendarDay={testDate}
      />
    );
    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("should call 'sendBookingsLink' with 'email' method if method = \"email\" and close the modal", () => {
    render(
      <SendBulkBookingsLinkDialog
        onCloseAll={() => {}}
        customers={[saul]}
        method={ClientMessageMethod.Email}
        onClose={mockOnClose}
        orgData={orgData}
        actions={
          {
            setSubmitting: () => {},
          } as unknown as FormikHelpers<OrganizationData>
        }
        calendarDay={testDate}
      />
    );
    screen.getByText(i18n.t(ActionButton.Send) as string).click();
    // expect(mockOnClose).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenNthCalledWith(
      2,
      mockSendBookingsLink({
        ...saul,
        deadline: "February 23",
        method: ClientMessageMethod.Email,
        bookingsLink: testBookingsLink,
      })
    );
    expect(mockDispatch).toHaveBeenNthCalledWith(
      1,
      mockUpdateOrganization({ ...orgData })
    );
  });
});
