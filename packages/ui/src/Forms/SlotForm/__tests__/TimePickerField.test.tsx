/**
 * @jest-environment jsdom
 */

import React from "react";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as formik from "formik";
import { Field } from "formik";

import { __decrementId__, __incrementId__ } from "@eisbuk/shared";

import TimePickerField from "../TimePickerField";

import { renderWithFormik } from "../../../utils/testUtils";

const mockSetValue = jest.fn();

const useFieldSpy = jest.spyOn(formik, "useField");
useFieldSpy.mockImplementation(
  () =>
    [
      {},
      {},
      {
        setValue: mockSetValue,
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
      renderWithFormik(<Field component={TimePickerField} name="time" />, {
        initialValues: { time: "08:00" },
      });
      expect(screen.getByRole("textbox")).toHaveProperty("value", "08:00");
    });

    test.skip("should fire setValue passed from context, on change", async () => {
      /**
       * @TODO We should find a different way to test this...my assumption is that no change handler gets called
       * because we're mocking the setValue, effectively blocking the update of the value in the field.
       */
      renderWithFormik(<Field component={TimePickerField} name="time" />);
      const timeInput = screen.getByRole("textbox");
      // clear the interval field
      screen.debug(timeInput);
      userEvent.clear(timeInput);
      userEvent.type(timeInput, "10:00");
      await waitFor(() => expect(mockSetValue).toHaveBeenCalledWith("10:00"));
    });

    test('should increment/decrement time by an hour on"+"/"-" button click', () => {
      renderWithFormik(<Field component={TimePickerField} name="time" />);
      screen.getByTestId(__incrementId__).click();
      expect(mockSetValue).toHaveBeenCalledWith("09:00");
      screen.getByTestId(__decrementId__).click();
      // we're testing change being called with one hour decrement from initial 'value' as 'value' doesn't due to mocking
      expect(mockSetValue).toHaveBeenCalledWith("07:00");
    });

    test('should default to"08:00" + increment/decrement if clicked with invalid time string', () => {
      renderWithFormik(
        <Field component={TimePickerField} name="time" value="invalid_string" />
      );
      screen.getByTestId(__incrementId__).click();
      expect(mockSetValue).toHaveBeenCalledWith("09:00");
    });
  });
});
