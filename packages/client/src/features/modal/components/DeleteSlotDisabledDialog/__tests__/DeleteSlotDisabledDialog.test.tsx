/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, afterEach, beforeEach } from "vitest";
import { screen, render, cleanup } from "@testing-library/react";

import i18n, { ActionButton } from "@eisbuk/translations";

import DeleteSlotDisabledDialog from "../DeleteSlotDisabledDialog";
import * as slotOperations from "@/store/actions/slotOperations";

import { baseSlot } from "@eisbuk/test-data/slots";

const mockOnClose = vi.fn();
// Mock deleteSlot to a, sort of, identity function
// to test it being dispatched to the store (with appropriate params)
// rather than just being called
const mockDeleteSlot = (params: any) => ({
  ...params,
  type: "deleteSlot",
});
vi.spyOn(slotOperations, "deleteSlot").mockImplementation(
  mockDeleteSlot as any
);

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("DeleteSlotDisabledDialog", () => {
  beforeEach(() => {
    render(
      <DeleteSlotDisabledDialog
        {...baseSlot}
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
