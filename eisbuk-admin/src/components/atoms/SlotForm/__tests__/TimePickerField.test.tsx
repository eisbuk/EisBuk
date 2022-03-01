/**
 * @jest-environment jsdom
 */

import React from "react";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as formik from "formik";

import TimePickerField from "../TimePickerField";

import { renderWithFormik } from "@/__testUtils__/wrappers";

import { __decrementId__, __incrementId__ } from "../__testData__/testIds";

const mockSetValue = jest.fn();
const mockSetError = jest.fn();

const useFieldSpy = jest.spyOn(formik, "useField");
useFieldSpy.mockImplementation(
  () =>
    [
      { value: "08:00" },
      {},
      {
        setValue: mockSetValue,
        setError: mockSetError,
      },
    ] as any
);

describe("SlotForm,", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("TimePickerField", () => {
    test("should have value passed from context", () => {
      renderWithFormik(<TimePickerField name="time" />);
      expect(screen.getByRole("textbox")).toHaveProperty("value", "08:00");
    });

    xtest("should fire setValue passed from context, on change", () => {
      /** @TODO Fix this */
      renderWithFormik(<TimePickerField name="time" />);
      const timeInput = screen.getByRole("textbox");
      // clear the interval field
      fireEvent.change(timeInput, { e: { target: { value: "" } } });
      userEvent.type(timeInput, "09:00");
      expect(mockSetValue).toHaveBeenCalledWith("09:00");
    });

    test('should increment/decrement time by an hour on "+"/"-" button click', () => {
      renderWithFormik(<TimePickerField name="time" />);
      screen.getByTestId(__incrementId__).click();
      expect(mockSetValue).toHaveBeenCalledWith("09:00");
      screen.getByTestId(__decrementId__).click();
      // we're testing change being called with one hour decrement from initial 'value' as 'value' doesn't due to mocking
      expect(mockSetValue).toHaveBeenCalledWith("07:00");
    });

    test('should default to "08:00" + increment/decrement if clicked with invalid time string', () => {
      renderWithFormik(<TimePickerField name="time" value="invalid_string" />);
      screen.getByTestId(__incrementId__).click();
      expect(mockSetValue).toHaveBeenCalledWith("09:00");
    });
  });
});
