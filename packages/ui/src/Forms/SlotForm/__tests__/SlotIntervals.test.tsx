import React from "react";
import { describe, afterEach, vi, test, expect } from "vitest";
import { cleanup, screen } from "@testing-library/react";

import { __timeIntervalFieldId__ } from "@eisbuk/testing/testIds";

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
    const initialValues = { intervals: [interval1, interval2] };

    test("should render intervals from initial values", () => {
      renderWithFormik(<SlotIntervals />, { initialValues });
      const intervalFields = screen.queryAllByTestId(__timeIntervalFieldId__);
      expect(intervalFields.length).toEqual(2);
    });

    test("should not explode if no intervals are present in initial value", () => {
      renderWithFormik(<SlotIntervals />);
    });
  });
});
