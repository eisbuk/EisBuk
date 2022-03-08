/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, render } from "@testing-library/react";
import React from "react";
import * as reactRedux from "react-redux";

import DateSwitcher from "../DateSwitcher";
import AdapterDateFns from "@mui/lab/AdapterLuxon";
import LocalizationProvider from "@mui/lab/LocalizationProvider";

import { testDateLuxon } from "@/__testData__/date";
import { changeCalendarDate } from "@/store/actions/appActions";
import { DateTime } from "luxon";

const mockDispatch = jest.fn();
jest.spyOn(reactRedux, "useDispatch").mockImplementation(() => mockDispatch);
const mockSelector = jest.spyOn(reactRedux, "useSelector");
mockSelector.mockImplementation(() => testDateLuxon);

describe("Date Switcher", () => {
  describe("Smoke Test", () => {
    const testDateISO = "2021-08-12";
    const testDateDateTime = DateTime.fromISO(testDateISO);
    test("should render component", () => {
      render(
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateSwitcher
            currentDate={testDateDateTime}
            open={true}
            anchorEl={null}
            handleClose={() => {}}
          />
        </LocalizationProvider>
      );
    });

    test("should change calendar day to picked date", () => {
      render(
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateSwitcher
            currentDate={testDateDateTime}
            open={true}
            anchorEl={null}
            handleClose={() => {}}
          />
        </LocalizationProvider>
      );

      const nexDayDateTime = testDateDateTime.plus({ days: 1 });

      const dayToClick = screen.getByLabelText(nexDayDateTime.toFormat("DD"));
      dayToClick.click();
      expect(mockDispatch).toHaveBeenCalledWith(
        changeCalendarDate(nexDayDateTime)
      );
    });

    test("should disable picking non-mondays on slots view", () => {
      render(
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateSwitcher
            currentDate={testDateDateTime}
            jump="week"
            open={true}
            anchorEl={null}
            handleClose={() => {}}
          />
        </LocalizationProvider>
      );

      const nonMonday = testDateDateTime.startOf("week").plus({ days: 1 });

      const dayToClick = screen.getByLabelText(nonMonday.toFormat("DD"));

      expect(dayToClick).toBeDisabled();
    });
  });
});
