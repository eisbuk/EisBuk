import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TimeIntervalField from "../TimeIntervalField";

import { renderWithFormik } from "@/__testUtils__/wrappers";

import {
  __deleteIntervalId__,
  __startTimeInputId__,
} from "../__testData__/testIds";

const mockSetValue = jest.fn();

jest.mock("formik", () => ({
  ...jest.requireActual("formik"),
  useField: () => [
    { value: "08:00-09:00" },
    {},
    {
      setValue: mockSetValue,
    },
  ],
}));

describe("'SlotForm',", () => {
  describe("TimeIntervalField", () => {
    test("should fire delete function on delete button click", () => {
      const mockDelete = jest.fn();
      renderWithFormik(<TimeIntervalField name="name" onDelete={mockDelete} />);
      screen.getByTestId(__deleteIntervalId__).click();
      expect(mockDelete).toHaveBeenCalled();
    });

    test("should update value", () => {
      renderWithFormik(<TimeIntervalField name="name" onDelete={() => {}} />);
      const startTimeInput = screen.getByTestId(__startTimeInputId__);
      userEvent.type(startTimeInput, "08:30");
      expect(mockSetValue).toHaveBeenCalledWith("08:30 - 9:00");
    });
  });
});
