import React from "react";
import { describe, afterEach, vi, test, expect } from "vitest";
import { cleanup, screen } from "@testing-library/react";

import { testId } from "@eisbuk/testing/testIds";
import { slotAttendances } from "@eisbuk/testing/slots";

import SlotIntervals from "../SlotIntervals";

import { renderWithFormik } from "../../../utils/testUtils";

describe("SlotForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("SlotIntervals", () => {
    // some dummy values will be using on an off as initial values
    const interval1 = "09:00-10:00";
    const interval2 = "12:00-15:00";
    const interval3 = "13:00-13:50";
    const interval4 = "14:00-14:50";
    const initialValues = { intervals: [interval1, interval2] };

    test("should render intervals from initial values", () => {
      renderWithFormik(<SlotIntervals />, { initialValues });
      const intervalFields = screen.queryAllByTestId(
        testId("time-interval-field")
      );
      expect(intervalFields.length).toEqual(2);
    });
    test("should render disabled intervals if they match attendance bookedIntervals", () => {
      renderWithFormik(<SlotIntervals slotAttendances={slotAttendances} />, {
        initialValues: { intervals: [interval3, interval4] },
      });
      const startIntervalFields = screen.queryAllByTestId(
        testId("start-time-input")
      );
      expect(startIntervalFields[0]).toHaveProperty("disabled");
      expect(startIntervalFields[1]).toHaveProperty("disabled");
    });

    test("should not explode if no intervals are present in initial value", () => {
      renderWithFormik(<SlotIntervals />);
    });
  });
});
