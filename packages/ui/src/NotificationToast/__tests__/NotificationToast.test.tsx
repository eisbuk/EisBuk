import React from "react";
import { render, screen } from "@testing-library/react";

import NotificationToast, {
  NotificationToastVariant,
} from "../NotificationToast";

describe("NotificationToast", () => {
  test("should call 'onClose' on close button click", () => {
    const mockOnClose = jest.fn();
    render(
      <NotificationToast
        onClose={mockOnClose}
        variant={NotificationToastVariant.Success}
      >
        Message
      </NotificationToast>
    );
    screen.getByRole("button").click();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
