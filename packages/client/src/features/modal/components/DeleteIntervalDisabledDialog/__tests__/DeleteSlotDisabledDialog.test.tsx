/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, afterEach, beforeEach } from "vitest";
import { screen, render, cleanup } from "@testing-library/react";

import i18n, { ActionButton } from "@eisbuk/translations";

import DeleteIntervalDisabledDialog from "../DeleteIntervalDisabledDialog";

import { intervals } from "@eisbuk/testing/slots";

const mockOnClose = vi.fn();

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("DeleteIntervalDisabledDialog", () => {
  beforeEach(() => {
    render(
      <DeleteIntervalDisabledDialog
        {...intervals[0]}
        onClose={mockOnClose}
        onCloseAll={() => {}}
      />
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  test("should call onClose on 'Dismiss' button click", () => {
    screen.getByText(i18n.t(ActionButton.Dismiss) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
