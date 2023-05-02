/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, afterEach, beforeEach } from "vitest";
import { screen, render, cleanup } from "@testing-library/react";

import i18n, { ActionButton } from "@eisbuk/translations";

import DeleteSlotDialog from "../DeleteSlotDialog";
import * as slotOperations from "@/store/actions/slotOperations";

import { baseSlot } from "@/__testData__/slots";

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

describe("DeleteSlotDialog", () => {
  beforeEach(() => {
    render(
      <DeleteSlotDialog
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

  test("should call onClose on cancel", () => {
    screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("should call delete slot with slot id and close the modal on confirm", () => {
    screen.getByText(i18n.t(ActionButton.Delete) as string).click();
    expect(mockDispatch).toHaveBeenCalledWith(mockDeleteSlot(baseSlot.id));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
