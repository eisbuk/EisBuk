/**
 * @jest-environment jest-environment-jsdom-sixteen
 */
import "@testing-library/jest-dom";
import React from "react";
import { cleanup, screen } from "@testing-library/react";
import { DateTime } from "luxon";
import i18n from "i18next";

import DateNavigation from "../DateNavigation";

import { renderWithRouter } from "@/__testUtils__/wrappers";

import { luxon2ISODate } from "@/utils/date";

import { __dateNavNextId__, __dateNavPrevId__ } from "@/__testData__/testIds";

// import { __toggleId__ } from "./testData";

afterEach(() => cleanup());

describe("Date Navigation", () => {
  describe("Smoke test", () => {
    test("should render properly as a render prop", () => {
      const testString = "Test";
      renderWithRouter(
        <DateNavigation>{() => <div>{testString}</div>}</DateNavigation>
      );

      screen.getByText(testString);
    });
  });

  describe("Test main functionality (date) with render prop data passing", () => {
    // fixed date (for consistency), will be used across the block
    const testDateISO = "2021-08-12";
    const testDateDateTime = DateTime.fromISO(testDateISO);
    // when our `testDate` is used, this will be the start of next month
    const nextMonthStart = "2021-09-01";

    test("should pass start date of current view to render function", () => {
      // shadowed test date used only within this test block
      const testDate = "2021-01-01";
      renderWithRouter(
        <DateNavigation defaultDate={DateTime.fromISO(testDate)} jump="month">
          {({ currentViewStart }) => luxon2ISODate(currentViewStart)}
        </DateNavigation>
      );
      screen.getByText(testDate);
    });

    test("should fall back to start of next timeframe if no default date has been provided", () => {
      // mock current date to keep tests consistent
      Date.now = jest.fn(() => Number(new Date(testDateISO)));
      renderWithRouter(
        <DateNavigation jump="month">
          {({ currentViewStart }) => luxon2ISODate(currentViewStart)}
        </DateNavigation>
      );
      screen.getByText(nextMonthStart);
    });

    test("should increment/decrement start date with respect to 'jump' prop", async () => {
      const currentMonthStart = testDateDateTime.startOf("month");
      renderWithRouter(
        <DateNavigation defaultDate={currentMonthStart} jump="month">
          {({ currentViewStart }) => luxon2ISODate(currentViewStart)}
        </DateNavigation>
      );
      const prevMonthStart = currentMonthStart
        .plus({ months: -1 })
        .toISO()
        .substr(0, 10);
      const incrementButton = screen.getByTestId(__dateNavNextId__);
      const decrementButton = screen.getByTestId(__dateNavPrevId__);
      // initial view start should be default date
      screen.getByText(luxon2ISODate(currentMonthStart));
      // test increment
      incrementButton.click();
      await screen.findByText(nextMonthStart);
      // test decrement
      decrementButton.click();
      decrementButton.click();
      await screen.findByText(prevMonthStart);
    });

    test("should fall back to week if no jump is provided", async () => {
      const currentWeekStart = testDateDateTime.startOf("week");
      const nextWeekStartISO = currentWeekStart
        .plus({ weeks: 1 })
        .toISO()
        .substr(0, 10);
      renderWithRouter(
        <DateNavigation defaultDate={currentWeekStart}>
          {({ currentViewStart }) => luxon2ISODate(currentViewStart)}
        </DateNavigation>
      );
      screen.getByTestId(__dateNavNextId__).click();
      await screen.findByText(nextWeekStartISO);
    });

    test("fault tolerance: should fall back to the start of timeframe if default date is not start", () => {
      renderWithRouter(
        <DateNavigation defaultDate={testDateDateTime}>
          {({ currentViewStart }) => luxon2ISODate(currentViewStart)}
        </DateNavigation>
      );
      // we're testing the week as it is default 'jump'
      const weekStartISO = testDateDateTime
        .startOf("week")
        .toISO()
        .substr(0, 10);
      screen.getByText(weekStartISO);
    });
  });

  describe("Test rendering of the timeframe (startTime-endTime) title", () => {
    // we're using this date as it's both start of week and month
    const testDateISO = "2021-03-01";
    const testDateDateTime = DateTime.fromISO(testDateISO);

    const spyT = jest.spyOn(i18n, "t");
    beforeEach(() => spyT.mockClear());

    test("should call translate function with start date and the date of last day of the week, in case of week view", () => {
      const endOfWeek = DateTime.fromISO("2021-03-07");
      renderWithRouter(<DateNavigation defaultDate={testDateDateTime} />);
      /** @TODO enable testing with i18n */
      // here we're testing calls to translation function
      // from `createDateTitle` function for simplicity
      expect(spyT).toHaveBeenCalledTimes(2);
      expect(spyT).toHaveBeenCalledWith("DateNavigationBar.Week", {
        date: testDateDateTime,
      });
      expect(spyT).toHaveBeenCalledWith("DateNavigationBar.Week", {
        date: endOfWeek,
      });
    });

    test("should call translate only once, with month string for month view", () => {
      renderWithRouter(
        <DateNavigation defaultDate={testDateDateTime} jump="month" />
      );
      expect(spyT).toHaveBeenCalledTimes(1);
      expect(spyT).toHaveBeenCalledWith("DateNavigationBar.Month", {
        date: testDateDateTime,
      });
    });

    test("should call translate only once, with day string for day view", () => {
      renderWithRouter(
        <DateNavigation defaultDate={testDateDateTime} jump="day" />
      );
      expect(spyT).toHaveBeenCalledTimes(1);
      expect(spyT).toHaveBeenCalledWith("DateNavigationBar.Day", {
        date: testDateDateTime,
      });
    });
  });
});
