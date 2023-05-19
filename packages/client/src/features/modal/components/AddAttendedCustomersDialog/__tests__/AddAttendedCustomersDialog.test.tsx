/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, afterEach } from "vitest";
import { screen, render, cleanup, waitFor } from "@testing-library/react";

import i18n, { AdminAria } from "@eisbuk/translations";

import AddAttendedCustomersDialog from "../AddAttendedCustomersDialog";
import * as attendanceOperations from "@/store/actions/attendanceOperations";

import { saul, walt } from "@eisbuk/test-data/customers";
import { baseSlot } from "@eisbuk/test-data/slots";

const mockOnClose = vi.fn();
// Mock markAttendance to a, sort of, identity function
// to test it being dispatched to the store (with appropriate params)
// rather than just being called
const mockMarkAttendance = (params: any) => ({
  params,
  type: "markAttendance",
});
vi.spyOn(attendanceOperations, "markAttendance").mockImplementation(
  mockMarkAttendance as any
);

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("AddAttendedCustomersDialog", () => {
  // It doesn't matter which interval we use as default
  // in production, the 'defaultInterval' will be determined before opening the modal
  const defaultInterval = Object.keys(baseSlot.intervals)[0];

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  test("should call onClose on 'x' button click", () => {
    render(
      <AddAttendedCustomersDialog
        onCloseAll={() => {}}
        customers={[saul, walt]}
        onClose={mockOnClose}
        {...{ ...baseSlot, defaultInterval }}
      />
    );
    screen.getByLabelText(i18n.t(AdminAria.CloseModal) as string).click();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("should add customer as having attended a default interval of given slot on customer click", () => {
    render(
      <AddAttendedCustomersDialog
        onCloseAll={() => {}}
        customers={[saul, walt]}
        onClose={mockOnClose}
        {...{ ...baseSlot, defaultInterval }}
      />
    );
    screen.getByText(saul.name).click();
    expect(mockDispatch).toHaveBeenCalledWith(
      mockMarkAttendance({
        customerId: saul.id,
        name: saul.name,
        surname: saul.surname,
        slotId: baseSlot.id,
        attendedInterval: defaultInterval,
      })
    );
    // Shouldn't close modal on each customer click
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test("should not render 'deleted' customers", () => {
    render(
      <AddAttendedCustomersDialog
        onCloseAll={() => {}}
        customers={[{ ...saul, deleted: true }, walt]}
        onClose={mockOnClose}
        {...{ ...baseSlot, defaultInterval }}
      />
    );
    // Should not show saul as he's marked as deleted
    expect(screen.queryByText(saul.name)).toBeFalsy();
    // Walt should still be rendered
    screen.getByText(walt.name);
  });

  test("should close the modal when there are no customers to mark as having attended", async () => {
    const { rerender } = render(
      <AddAttendedCustomersDialog
        onCloseAll={() => {}}
        customers={[{ ...saul, deleted: true }, walt]}
        onClose={mockOnClose}
        {...{ ...baseSlot, defaultInterval }}
      />
    );
    // Update props from outside to mark there are no more customers to show
    rerender(
      <AddAttendedCustomersDialog
        onCloseAll={() => {}}
        customers={[]}
        onClose={mockOnClose}
        {...{ ...baseSlot, defaultInterval }}
      />
    );
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
