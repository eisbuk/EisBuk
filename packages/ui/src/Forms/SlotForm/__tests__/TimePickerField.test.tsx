import React from "react";
import { describe, afterEach, vi, test, expect } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field } from "formik";

import { testId } from "@eisbuk/testing/testIds";

import TimePickerField from "../TimePickerField";

import { renderWithFormik } from "../../../utils/testUtils";

const mockSetValue = vi.fn();

vi.mock("formik", async () => {
  const formik = await vi.importActual("formik");

  return {
    ...(formik as Record<string, any>),
    useField: () => [
      {},
      {},
      {
        setValue: mockSetValue,
      },
    ],
  };
});

describe("SlotForm,", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
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
      screen.getByTestId(testId("increment-button")).click();
      expect(mockSetValue).toHaveBeenCalledWith("09:00");
      screen.getByTestId(testId("decrement-button")).click();
      // we're testing change being called with one hour decrement from initial 'value' as 'value' doesn't due to mocking
      expect(mockSetValue).toHaveBeenCalledWith("07:00");
    });

    test('should default to"08:00" + increment/decrement if clicked with invalid time string', async () => {
      renderWithFormik(
        <Field component={TimePickerField} name="time" value="invalid_string" />
      );
      screen.getByTestId(testId("increment-button")).click();
      await waitFor(() => expect(mockSetValue).toHaveBeenCalledWith("09:00"));
    });

    test("should be disabled if field props contain disabled", async () => {
      renderWithFormik(
        <Field component={TimePickerField} name="time" disabled={true} />
      );
      screen.getByTestId(testId("increment-button")).click();
      await waitFor(() => expect(mockSetValue).not.toHaveBeenCalled());
      screen.getByTestId(testId("decrement-button")).click();
      await waitFor(() => expect(mockSetValue).not.toHaveBeenCalled());
    });
  });
});
