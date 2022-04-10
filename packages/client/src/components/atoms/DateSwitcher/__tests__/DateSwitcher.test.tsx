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
import { __pickedDay__ } from "@/__testData__/testIds";

const mockDispatch = jest.fn();
jest.spyOn(reactRedux, "useDispatch").mockImplementation(() => mockDispatch);
const mockSelector = jest.spyOn(reactRedux, "useSelector");
mockSelector.mockImplementation(() => testDateLuxon);

describe("Date Switcher", () => {
  describe("Smoke Test", () => {
    const testDateDateTime = DateTime.fromISO("2021-08-12");

    test("should change calendar day to picked date", () => {
      render(
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateSwitcher
            currentDate={testDateDateTime}
            open={true}
            anchorEl={null}
            onClose={() => {}}
            jump={"week"}
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
    test("should pick whole week when a day is clicked on slots and customer calendar views", () => {
      render(
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateSwitcher
            currentDate={testDateDateTime}
            open={true}
            anchorEl={null}
            onClose={() => {}}
            jump={"week"}
          />
        </LocalizationProvider>
      );

      const dayToClick = screen.getByLabelText(
        testDateDateTime.plus({ days: 1 }).toFormat("DD")
      );
      dayToClick.click();
      expect(screen.getAllByTestId(__pickedDay__)).toHaveLength(7);
    });
    test("should pick one day on booking and attendance view", () => {
      render(
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateSwitcher
            currentDate={testDateDateTime}
            open={true}
            anchorEl={null}
            onClose={() => {}}
            jump={"day"}
          />
        </LocalizationProvider>
      );

      const dayToClick = screen.getByLabelText(
        testDateDateTime.plus({ days: 1 }).toFormat("DD")
      );
      dayToClick.click();
      expect(screen.queryByTestId(__pickedDay__)).toBeNull();
    });
  });
});
