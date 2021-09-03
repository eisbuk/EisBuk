import React from "react";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TimePickerField from "../TimePickerField";

import { renderWithFormik } from "@/__testUtils__/wrappers";
import { __decrementId__, __incrementId__ } from "../__testData__/testIds";

const mockSetValue = jest.fn();
jest.mock("formik", () => ({
  ...jest.requireActual("formik"),
  useField: () => [{ value: "08:00" }, {}, { setValue: mockSetValue }],
}));

describe("SlotForm,", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("TimePickerField", () => {
    test("should have value passed from context, if no 'value' prop has been provided", () => {
      renderWithFormik(<TimePickerField name="name" />);
      expect(screen.getByRole("textbox")).toHaveProperty("value", "08:00");
    });

    test("should fire setValue passed from context, on change, if no 'onChange' prop has been provided", () => {
      renderWithFormik(<TimePickerField name="name" />);
      const timeInput = screen.getByRole("textbox");
      userEvent.type(timeInput, "09:00");
      expect(mockSetValue).toHaveBeenCalledWith("09:00", true);
    });

    test("should give presedence (over 'value' from context) to 'value' recieved as props", () => {
      renderWithFormik(<TimePickerField name="name" value="11:00" />);
      expect(screen.getByRole("textbox")).toHaveProperty("value", "11:00");
    });

    test("should give presedence (over 'setValue' from context) to 'onChange' recieved as props", () => {
      const mockOnChange = jest.fn();
      renderWithFormik(<TimePickerField name="name" onChange={mockOnChange} />);
      const timeInput = screen.getByRole("textbox");
      userEvent.type(timeInput, "09:00");
      expect(mockOnChange).toHaveBeenCalledWith("09:00", true);
      expect(mockSetValue).not.toHaveBeenCalled();
    });

    test('should increment/decrement time by an hour on "+"/"-" button click', () => {
      renderWithFormik(<TimePickerField name="name" />);
      screen.getByTestId(__incrementId__).click();
      expect(mockSetValue).toHaveBeenCalledWith("09:00", true);
      screen.getByTestId(__decrementId__).click();
      // we're testing change being called with one hour decrement from initial 'value' as 'value' doesn't due to mocking
      expect(mockSetValue).toHaveBeenCalledWith("07:00", true);
    });
  });
});
