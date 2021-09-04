import React from "react";
import {
  cleanup,
  fireEvent,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as formik from "formik";

import { __invalidTime } from "@/lib/errorMessages";

import TimePickerField from "../TimePickerField";

import { renderWithFormik } from "@/__testUtils__/wrappers";

import { __decrementId__, __incrementId__ } from "../__testData__/testIds";
import { testWithMutationObserver } from "@/__testUtils__/envUtils";

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

// We're translating errors internally, so for testing, we'll be mocking t function to return it's input (rather than translation)
jest.mock("i18next", () => ({
  useTranslation: () => ({ t: (str: string) => str }),
}));

describe("SlotForm,", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("TimePickerField", () => {
    test("should have value passed from context, if no 'value' prop has been provided", () => {
      renderWithFormik(<TimePickerField name="time" />);
      expect(screen.getByRole("textbox")).toHaveProperty("value", "08:00");
    });

    test("should fire setValue passed from context, on change, if no 'onChange' prop has been provided", () => {
      renderWithFormik(<TimePickerField name="time" />);
      const timeInput = screen.getByRole("textbox");
      userEvent.type(timeInput, "09:00");
      expect(mockSetValue).toHaveBeenCalledWith("09:00");
    });

    test("should give presedence (over 'value' from context) to 'value' recieved as props", () => {
      renderWithFormik(<TimePickerField name="time" value="11:00" />);
      expect(screen.getByRole("textbox")).toHaveProperty("value", "11:00");
    });

    test("should give presedence (over 'setValue' from context) to 'onChange' recieved as props", () => {
      const mockOnChange = jest.fn();
      renderWithFormik(<TimePickerField name="time" onChange={mockOnChange} />);
      const timeInput = screen.getByRole("textbox");
      userEvent.type(timeInput, "09:00");
      expect(mockOnChange).toHaveBeenCalledWith("09:00");
      expect(mockSetValue).not.toHaveBeenCalled();
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

  describe("TimePickerField, validation", () => {
    beforeEach(() => {
      // we're restoring mocks in order to test with actual formik (and receive state updates appropriately)
      jest.restoreAllMocks();
    });

    test('should display error if invalid time string (different from "HH:mm")', () => {
      renderWithFormik(<TimePickerField name="time" />);
      const timeInput = screen.getByRole("textbox");
      userEvent.type(timeInput, "153:12");
      screen.getByText(__invalidTime);
    });

    test('should not display error for timestring format "9:00" (not 09:00. but still the same)', () => {
      renderWithFormik(<TimePickerField name="time" />);
      const timeInput = screen.getByRole("textbox");
      fireEvent.change(timeInput, { target: { value: "9:00" } });
      expect(screen.queryByText(__invalidTime)).toEqual(null);
    });

    testWithMutationObserver(
      "should remove error when input valid",
      async () => {
        renderWithFormik(<TimePickerField name="time" />);
        // create validation error
        const timeInput = screen.getByRole("textbox");
        userEvent.type(timeInput, "153:12");
        screen.getByText(__invalidTime);
        // fix error
        userEvent.type(timeInput, "09:00");
        await waitForElementToBeRemoved(() => screen.getByText(__invalidTime));
      }
    );
  });
});
