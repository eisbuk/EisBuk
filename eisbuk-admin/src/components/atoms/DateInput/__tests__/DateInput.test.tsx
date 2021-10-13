import React from "react";
import { screen, fireEvent } from "@testing-library/react";
// import * as formik from "formik";

import DateInput from "../DateInput";

import { renderWithFormik } from "@/__testUtils__/wrappers";

/**
 * A spy function we're using to mock different values passed
 * from formik context as well as test `setValue` (received from context)
 * being called with proper value
 */
// const useFieldSpy = jest.spyOn(formik, "useField");

describe("Date Input", () => {
  describe("smoke test", () => {
    test("should render date input", () => {
      renderWithFormik(<DateInput />);
      screen.getByRole("textbox");
    });
  });

  describe("Test input functionality", () => {
    test("should call 'onChange' on user input", () => {
      const testInput = "test";
      const mockOnChange = jest.fn();
      renderWithFormik(<DateInput onChange={mockOnChange} />);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: testInput },
      });
      expect(mockOnChange).toHaveBeenCalledWith(testInput);
    });

    test("should parse european date into ISOString", () => {
      const testInput = "01/12/2021";
      const isoDate = "2021-12-01";
      const mockOnChange = jest.fn();
      renderWithFormik(<DateInput onChange={mockOnChange} />);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: testInput },
      });
      expect(mockOnChange).toHaveBeenCalledWith(isoDate);
    });

    test("should parse european date into ISOString with . or -", () => {
      const dashInput = "01-12-2021";
      const dotInput = "01.12.2021";
      const isoDate = "2021-12-01";
      const mockOnChange = jest.fn();
      renderWithFormik(<DateInput onChange={mockOnChange} />);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: dashInput },
      });
      expect(mockOnChange).toHaveBeenCalledWith(isoDate);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: dotInput },
      });
      expect(mockOnChange).toHaveBeenCalledWith(isoDate);
    });

    test("should parse ISOString 'value' into slash separated european date", () => {
      const testInput = "2021-12-01";
      const slashSeparated = "01/12/2021";
      renderWithFormik(<DateInput value={testInput} />);
      const inputField = screen.getByRole("textbox");
      expect(inputField).toHaveProperty("value", slashSeparated);
    });
  });
});
