import React from "react";
import { describe, afterEach, vi, test, expect } from "vitest";
import { screen, cleanup } from "@testing-library/react";
import * as formik from "formik";

import { testId } from "@eisbuk/testing/testIds";

import TimeIntervalField from "../TimeIntervalField";

import { renderWithFormik } from "../../../utils/testUtils";

const mockSetValue = vi.fn();
const mockSetError = vi.fn();

vi.doMock("formik", () => ({
  ...formik,
  useField: () => [
    { value: "08:00-09:00" },
    {},

    {
      setValue: mockSetValue,
      setError: mockSetError,
    },
  ],
}));

describe("'SlotForm',", () => {
  // default props we'll be using to avoid unexpected behavior
  const baseProps = {
    name: "interval",
    onDelete: () => {},
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("TimeIntervalField", () => {
    test("should fire delete function on delete button click", () => {
      const mockDelete = vi.fn();
      renderWithFormik(
        <TimeIntervalField {...baseProps} onDelete={mockDelete} />
      );
      screen.getByTestId(testId("delete-interval-button")).click();
      expect(mockDelete).toHaveBeenCalled();
    });

    /** @TODO might be a pointless test */
    test("should fire delete function when disabled but only the dialog would show up", () => {
      const mockDelete = vi.fn();
      renderWithFormik(
        <TimeIntervalField
          {...baseProps}
          onDelete={mockDelete}
          disableUpdate={true}
        />
      );
      screen.getByTestId(testId("delete-interval-button")).click();
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
