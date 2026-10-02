/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, afterEach, beforeEach } from "vitest";
import { screen, render, cleanup } from "@testing-library/react";

import i18n, { ActionButton, Prompt } from "@eisbuk/translations";
import { SlotInterface, SlotType, Category } from "@eisbuk/shared";

import ReplaceBookingDialog from "../ReplaceBookingDialog";
import * as bookingOperations from "@/store/actions/bookingOperations";

const lesson: SlotInterface = {
  id: "lesson-1",
  date: "2022-02-01",
  type: SlotType.Ice,
  categories: [Category.Competitive],
  notes: "",
  intervals: {
    "16:00-17:00": { startTime: "16:00", endTime: "17:00" },
    "16:00-17:50": { startTime: "16:00", endTime: "17:50" },
  },
};

const mockOnClose = vi.fn();
// Mock bookInterval to return its params, to test it being dispatched (with appropriate params)
const mockBookInterval = (params: any) => ({ ...params, type: "bookInterval" });
vi.spyOn(bookingOperations, "bookInterval").mockImplementation(
  mockBookInterval as any,
);

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("ReplaceBookingDialog", () => {
  beforeEach(() => {
    render(
      <ReplaceBookingDialog
        {...lesson}
        secretKey="secret-key"
        bookedInterval="16:00-17:00"
        newInterval="16:00-17:50"
        onClose={mockOnClose}
        onCloseAll={() => {}}
      />,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  test("should name what is booked now and what it will become", () => {
    screen.getByText(i18n.t(Prompt.ReplaceBookingTitle) as string);
    screen.getByText(i18n.t(Prompt.ReplaceBookingCurrent) as string);
    screen.getByText(i18n.t(Prompt.ReplaceBookingNew) as string);
    screen.getByText("16:00 - 17:00");
    screen.getByText("16:00 - 17:50");
  });

  test("should keep the booking (no write) and close on 'keep'", () => {
    screen.getByText(i18n.t(ActionButton.KeepBooking) as string).click();
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("should book the new interval, as an explicit replacement of the booked one, on confirm", () => {
    screen.getByText(i18n.t(ActionButton.ReplaceBooking) as string).click();
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      mockBookInterval({
        secretKey: "secret-key",
        slotId: lesson.id,
        date: lesson.date,
        interval: "16:00-17:50",
        replacedInterval: "16:00-17:00",
      }),
    );
    expect(mockOnClose).toHaveBeenCalled();
  });
});
