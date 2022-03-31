/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, cleanup } from "@testing-library/react";
import * as formik from "formik";

import TimeIntervalField from "../TimeIntervalField";

import { renderWithFormik } from "@/__testUtils__/wrappers";

import { __deleteIntervalId__ } from "../__testData__/testIds";

const mockSetValue = jest.fn();
const mockSetError = jest.fn();

jest.spyOn(formik, "useField").mockImplementation(
  () =>
    [
      { value: "08:00-09:00" },
      {},
      {
        setValue: mockSetValue,
        setError: mockSetError,
      },
    ] as any
);

describe("'SlotForm',", () => {
  // default props we'll be using to avoid unexpected behavior
  const baseProps = {
    name: "interval",
    onDelete: () => {},
  };

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("TimeIntervalField", () => {
    test("should fire delete function on delete button click", () => {
      const mockDelete = jest.fn();
      renderWithFormik(
        <TimeIntervalField {...baseProps} onDelete={mockDelete} />
      );
      screen.getByTestId(__deleteIntervalId__).click();
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
