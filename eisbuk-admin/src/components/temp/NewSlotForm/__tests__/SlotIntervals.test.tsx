import React from "react";
import { cleanup, screen } from "@testing-library/react";

import SlotIntervals from "../SlotIntervals";

import { renderWithFormik } from "@/__testUtils__/wrappers";

import { __timeIntervalFieldId__ } from "../__testData__/testIds";
import userEvent from "@testing-library/user-event";
import { __timeMismatch } from "@/lib/errorMessages";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({ t: (str: string) => str }),
}));

describe("SlotForm,", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("SlotIntervals", () => {
    // some dummy values will be using on an off as initial values
    const interval1 = "09:00-10:00";
    const interval2 = "12:00-15:00";
    const initialValues = { intervals: [interval1, interval2] };

    test("should render intervals from initial values", () => {
      renderWithFormik(<SlotIntervals />, { initialValues });
      const intervalFields = screen.queryAllByTestId(__timeIntervalFieldId__);
      expect(intervalFields.length).toEqual(2);
    });

    test("should not explode if no intervals are present in initial value", () => {
      renderWithFormik(<SlotIntervals />);
    });

    test("when causing invalid time error, should display error only to slot with invalid time", () => {
      renderWithFormik(<SlotIntervals />, { initialValues });
      // start and end time of the first interval
      const [startTime] = screen.getAllByRole("textbox");
      userEvent.type(startTime, "20:00");
      const errorsOnScreen = screen.getAllByText(__timeMismatch);
      expect(errorsOnScreen.length).toEqual(1);
    });
  });
});
