/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, afterEach, beforeEach } from "vitest";
import { screen, render } from "@testing-library/react";
import { DateTime } from "luxon";

import FinalizeBookingsDialog from "../FinalizeBookingsDialog";
import * as finalizeUtils from "../utils";

import { saul } from "@eisbuk/testing/customers";
import i18n, { ActionButton } from "@eisbuk/translations";

const month = DateTime.fromISO("2022-01-01");

describe("FinalizeBookingsDialog", () => {
  const mockOnClose = vi.fn();
  const finalizeBookingsSpy = vi
    .spyOn(finalizeUtils, "finalizeBookings")
    .mockImplementation((() => {}) as any);

  beforeEach(() => {
    render(
      <FinalizeBookingsDialog
        onCloseAll={() => {}}
        onClose={mockOnClose}
        customerId={saul.id}
        secretKey={saul.secretKey}
        {...{ month }}
      />
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should call onClose on cancel", () => {
    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
    expect(finalizeBookingsSpy).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("should call onClose on cancel", () => {
    screen.getByText(i18n.t(ActionButton.FinalizeBookings) as string).click();
    expect(finalizeBookingsSpy).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
