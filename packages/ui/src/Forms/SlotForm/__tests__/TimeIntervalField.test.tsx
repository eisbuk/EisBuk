import React from "react";
import { describe, afterEach, vi, test, expect } from "vitest";
import { screen, cleanup } from "@testing-library/react";
import * as formik from "formik";

import { __deleteIntervalId__ } from "@eisbuk/testing/testIds";

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
      screen.getByTestId(__deleteIntervalId__).click();
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
