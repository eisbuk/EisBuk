/**
 * @jest-environment jest-environment-jsdom-sixteen
 */
import "@testing-library/jest-dom";
import React from "react";
import { cleanup, screen, render } from "@testing-library/react";
import { DateTime } from "luxon";
import * as reactRedux from "react-redux";

import DateNavigation from "../DateNavigation";

import { changeCalendarDate } from "@/store/actions/appActions";

import { renderWithRouter } from "@/__testUtils__/wrappers";
import i18n from "@/__testUtils__/i18n";

import { testDateLuxon } from "@/__testData__/date";
import { __dateNavNextId__, __dateNavPrevId__ } from "@/__testData__/testIds";
import { DateFormat } from "@/enums/translations";

// import { __toggleId__ } from "./testData";

const mockDispatch = jest.fn();
jest.spyOn(reactRedux, "useDispatch").mockImplementation(() => mockDispatch);
const mockSelector = jest.spyOn(reactRedux, "useSelector");
mockSelector.mockImplementation(() => testDateLuxon);

describe("Date Navigation", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("Smoke test", () => {
    test("should render properly as a render prop", () => {
      const testString = "Test";
      render(<DateNavigation>{() => <div>{testString}</div>}</DateNavigation>);

      screen.getByText(testString);
    });
  });

  describe("Test date pagination", () => {
    // fixed date (for consistency), will be used across the block
    const testDateISO = "2021-08-12";
    const testDateDateTime = DateTime.fromISO(testDateISO);

    const currentMonthStart = testDateDateTime.startOf("month");
    const currentWeekStart = testDateDateTime.startOf("week");

    test("should increment date when 'jump' is week keeping the week day", async () => {
      mockSelector.mockReturnValueOnce(testDateDateTime);
      render(<DateNavigation jump="week" />);
      const incrementButton = screen.getByTestId(__dateNavNextId__);
      incrementButton.click();
      const nextWeekDateTime = testDateDateTime.plus({ days: 7 });
      expect(mockDispatch).toHaveBeenCalledWith(
        changeCalendarDate(nextWeekDateTime)
      );
    });

    test("should increment date with respect to 'jump' prop on increment click", async () => {
      mockSelector.mockReturnValueOnce(currentMonthStart);
      render(<DateNavigation jump="month" />);
      const incrementButton = screen.getByTestId(__dateNavNextId__);
      incrementButton.click();
      const nextMonthStart = currentMonthStart.plus({ months: 1 });
      expect(mockDispatch).toHaveBeenCalledWith(
        changeCalendarDate(nextMonthStart)
      );
    });

    test("should decrement date with respect to 'jump' prop on decrement click", async () => {
      mockSelector.mockReturnValueOnce(currentMonthStart);
      render(<DateNavigation jump="month" />);
      const decrementButton = screen.getByTestId(__dateNavPrevId__);
      decrementButton.click();
      const prevMonthStart = currentMonthStart.plus({ months: -1 });
      expect(mockDispatch).toHaveBeenCalledWith(
        changeCalendarDate(prevMonthStart)
      );
    });

    test("should fall back to week if no jump is provided", async () => {
      mockSelector.mockReturnValueOnce(currentWeekStart);
      const nextWeekStart = currentWeekStart.plus({ weeks: 1 });
      renderWithRouter(<DateNavigation defaultDate={currentWeekStart} />);
      screen.getByTestId(__dateNavNextId__).click();
      expect(mockDispatch).toHaveBeenCalledWith(
        changeCalendarDate(nextWeekStart)
      );
    });
  });

  describe("Test rendering of the timeframe (startTime-endTime) title", () => {
    test("should call translate function with start date and the date of last day of the week, in case of week view", () => {
      const endOfWeek = testDateLuxon.endOf("week").startOf("day");
      renderWithRouter(<DateNavigation />);
      const weekStart = i18n.t(DateFormat.DayMonth, {
        date: testDateLuxon,
      }) as string;
      const weekEnd = i18n.t(DateFormat.DayMonth, {
        date: endOfWeek,
      }) as string;
      const weekString = `${weekStart} - ${weekEnd}`;
      screen.getByText(weekString);
    });

    test("should call translate only once, with month string for month view", () => {
      renderWithRouter(<DateNavigation jump="month" />);
      screen.getByText(
        i18n.t(DateFormat.MonthYear, { date: testDateLuxon }) as string
      );
    });

    test("should call translate only once, with day string for day view", () => {
      renderWithRouter(<DateNavigation jump="day" />);
      screen.getByText(
        i18n.t(DateFormat.Full, { date: testDateLuxon }) as string
      );
    });
  });
});
