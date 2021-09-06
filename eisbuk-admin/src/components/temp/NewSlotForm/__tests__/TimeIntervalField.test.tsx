import React, { useState } from "react";
import { screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as formik from "formik";

import { __timeMismatch } from "@/lib/errorMessages";

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
    onChange: () => {},
    value: "08:00-09:00",
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

    test("should call 'onChange' on 'startTime-endTime' update", () => {
      const mockOnChange = jest.fn();
      renderWithFormik(
        <TimeIntervalField {...baseProps} onChange={mockOnChange} />
      );
      const [startTimeInput, endTimeInput] = screen.getAllByRole("textbox");
      userEvent.type(startTimeInput, "08:30");
      expect(mockOnChange).toHaveBeenCalledWith("08:30-09:00");
      userEvent.type(endTimeInput, "09:30");
      expect(mockOnChange).toHaveBeenCalledWith("08:30-09:30");
    });

    test("should set error if start time <= end time", () => {
      renderWithFormik(<TimeIntervalField {...baseProps} />);
      const [startTimeInput] = screen.getAllByRole("textbox");
      // with default time "08:00-09:00", this change should resultit "11:00-09:00"
      userEvent.type(startTimeInput, "11:00");
      expect(mockSetError).toHaveBeenCalledWith(__timeMismatch);
    });

    test("should not set error if one of the times is invalid time string", () => {
      renderWithFormik(<TimeIntervalField {...baseProps} />);
      const [startTimeInput] = screen.getAllByRole("textbox");
      // with default time "08:00-09:00", this change should result in "11:00-09:00"
      userEvent.type(startTimeInput, "not_time_string");
      // we're testing the error not being called with _timeMismatch (as it will get called from child component, with different error value)
      expect(mockSetError).not.toHaveBeenCalledWith(__timeMismatch);
    });
  });

  describe("TimeIntervalField-integration", () => {
    beforeAll(() => {
      // we're restoring mocks in order to test with actual formik (and receive state updates appropriately)
      jest.restoreAllMocks();
    });

    beforeEach(() => {
      const TestForm = ({
        children,
      }: {
        children: (props: {
          onChange: (a: string) => void;
          value: string;
        }) => JSX.Element;
      }): JSX.Element => {
        const [value, onChange] = useState("08:00-09:00");
        return <>{children({ value, onChange })}</>;
      };

      renderWithFormik(
        <TestForm>
          {(props) => <TimeIntervalField {...baseProps} {...props} />}
        </TestForm>
      );
    });

    test("should update local input values in accordance to form state", async () => {
      const [startTimeInput, endTimeInput] = screen.getAllByRole("textbox");
      userEvent.type(startTimeInput, "11:00");
      expect(startTimeInput).toHaveProperty("value", "11:00");
      userEvent.type(endTimeInput, "15:00");
      expect(endTimeInput).toHaveProperty("value", "15:00");
    });

    test("should show error when created and remove when fixed", () => {
      // initial time: "10:00-15:00"
      // create error
      const [startTimeInput, endTimeInput] = screen.getAllByRole("textbox");
      userEvent.type(startTimeInput, "16:00");
      screen.getByText(__timeMismatch);
      // fix error
      userEvent.type(endTimeInput, "20:00");
      const errorAfterCorrection = screen.queryByText(__timeMismatch);
      expect(errorAfterCorrection).toEqual(null);
    });
  });
});
