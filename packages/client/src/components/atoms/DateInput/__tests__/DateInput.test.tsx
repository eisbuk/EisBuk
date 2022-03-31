/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import * as formik from "formik";
import * as yup from "yup";

import i18n, { ValidationMessage } from "@eisbuk/translations";

import DateInput from "../DateInput";

import { renderWithFormik } from "@/__testUtils__/wrappers";

/**
 * A spy function we're using to mock different values passed
 * from formik context as well as test `setValue` (received from context)
 * being called with proper value
 */
const useFieldSpy = jest.spyOn(formik, "useField");

const mockSetValue = jest.fn();

/**
 * A name of our input field we'll be using throughout the tests
 */
const name = "date";

describe("Date Input", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("smoke test", () => {
    test("should render date input", () => {
      renderWithFormik(<DateInput {...{ name }} />);
      screen.getByRole("textbox");
    });
  });

  describe("Test updating of the string", () => {
    beforeEach(() => {
      useFieldSpy.mockReturnValueOnce([
        { value: "" },
        { error: "" },
        { setValue: mockSetValue },
      ] as any);
      renderWithFormik(<DateInput {...{ name }} />);
    });

    test("should call 'onChange' on user input", () => {
      const testInput = "test";
      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: testInput },
      });
      expect(mockSetValue).toHaveBeenCalledWith(testInput);
    });

    test("should parse european date into ISOString", () => {
      const testInput = "01/12/2021";
      const isoDate = "2021-12-01";
      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: testInput },
      });
      expect(mockSetValue).toHaveBeenCalledWith(isoDate);
    });

    test("should parse european date into ISOString with . or -", () => {
      const dashInput = "01-12-2021";
      const dotInput = "01.12.2021";
      const isoDate = "2021-12-01";
      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: dashInput },
      });
      expect(mockSetValue).toHaveBeenCalledWith(isoDate);
      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: dotInput },
      });
      expect(mockSetValue).toHaveBeenCalledWith(isoDate);
    });

    test("should parse european date with single digits into ISOString with . or -", () => {
      const dashInput = "1-12-2021";
      const dotInput = "1.12.2021";
      const isoDate = "2021-12-01";
      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: dashInput },
      });
      expect(mockSetValue).toHaveBeenCalledWith(isoDate);
      fireEvent.blur(screen.getByRole("textbox"), {
        target: { value: dotInput },
      });
      expect(mockSetValue).toHaveBeenCalledWith(isoDate);
    });
  });

  describe("Test processing of received value", () => {
    test("should parse ISOString 'value' into slash separated european date", () => {
      const testInput = "2021-12-01";
      const slashSeparated = "01/12/2021";
      renderWithFormik(<DateInput {...{ name }} />, {
        initialValues: { [name]: testInput },
      });
      const inputField = screen.getByRole("textbox");
      expect(inputField).toHaveProperty("value", slashSeparated);
    });
  });

  describe("Test error displaying", () => {
    const testError = ValidationMessage.InvalidDate;
    // it appears that in newer versions of Formik, the `initialErrors`
    // get invalidated if they're not set by `validationSchema`
    // therefore we're providing the error as `validationSchema` error
    // rather than `initialErrors`
    const validationSchema = yup.object().shape({
      date: yup.string().test({ message: testError, test: () => false }),
    });

    beforeEach(() => {
      renderWithFormik(<DateInput {...{ name }} />, {
        validationSchema,
      });
    });

    test("should display error message (translated if possible)", async () => {
      await screen.findByText(i18n.t(testError) as string);
    });
  });
});
