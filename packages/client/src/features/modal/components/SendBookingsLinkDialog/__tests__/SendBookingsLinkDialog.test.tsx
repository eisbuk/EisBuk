/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render } from "@testing-library/react";

import i18n, { ActionButton } from "@eisbuk/translations";

import { SendBookingLinkMethod } from "@/enums/other";

import SendBookingsLinkDialog from "../SendBookingsLinkDialog";

import { saul } from "@/__testData__/customers";

const dummyProps = {
  method: SendBookingLinkMethod.Email,
  email: saul.email as string,
};

describe("SendBookingsLinkDialog", () => {
  const mockOnClose = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should call onClose on cancel", () => {
    render(
      <SendBookingsLinkDialog
        {...dummyProps}
        method={SendBookingLinkMethod.Email}
        onClose={mockOnClose}
      />
    );
    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
