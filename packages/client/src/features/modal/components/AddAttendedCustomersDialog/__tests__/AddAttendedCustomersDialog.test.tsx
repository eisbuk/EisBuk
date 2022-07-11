/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup } from "@testing-library/react";

import AddAttendedCustomersDialog from "../AddAttendedCustomersDialog";
import * as attendanceOperations from "@/store/actions/attendanceOperations";

import { saul, walt } from "@/__testData__/customers";
import { baseSlot } from "@/__testData__/slots";
import { __closeCustomersListId__ } from "@/components/atoms/AttendanceCard/__testData__/testIds";

// dispatch(markAttendance({ customerId, slotId, attendedInterval }));

const mockOnClose = jest.fn();
// Mock markAttendance to a, sort of, identity function
// to test it being dispatched to the store (with appropriate params)
// rather than just being called
const mockMarkAttendance = (params: any) => ({
  params,
  type: "markAttendance",
});
jest
  .spyOn(attendanceOperations, "markAttendance")
  .mockImplementation(mockMarkAttendance as any);

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("AddAttendedCustomersDialog", () => {
  // It doesn't matter which interval we use as default
  // in production, the 'defaultInterval' will be determined before opening the modal
  const defaultInterval = Object.keys(baseSlot.intervals)[0];

  beforeEach(() => {
    render(
      <AddAttendedCustomersDialog
        customers={[saul, walt]}
        onClose={mockOnClose}
        {...{ ...baseSlot, defaultInterval }}
      />
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  test("should call onClose on 'x' button click", () => {
    screen.getByTestId(__closeCustomersListId__).click();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("should add customer as having attended a default interval of given slot on customer click", async () => {
    screen.getByText(saul.name).click();
    expect(mockDispatch).toHaveBeenCalledWith(
      mockMarkAttendance({
        customerId: saul.id,
        slotId: baseSlot.id,
        attendedInterval: defaultInterval,
      })
    );
    // Shouldn't close modal on each customer click
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
