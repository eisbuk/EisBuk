/**
 * @jest-environment jsdom-sixteen
 */
import React from "react";
import { screen, render, cleanup } from "@testing-library/react";
import { useLocation, useParams } from "react-router-dom";
import { mocked } from "ts-jest/utils";
import { DateTime } from "luxon";

import DateNavigation from "../DateNavigation";

import { __storybookDate__ } from "@/lib/constants";

import { luxon2ISODate } from "@/utils/date";

import { __dateNavNextId__ } from "@/__testData__/testIds";

/**
 * Mock `push` method on the return interface of `useHistory` from `react-router-dom`.
 * We're using this to spy on dispatches to `history.push()` inside of the component
 */
const mockHistoryPush = jest.fn();
/**
 * Mock of the entire `react-router-dom`.
 * We're using this to assign mock functions in order to mock return values and spy on function calls.
 * Mocked functions:
 * - useParams
 * - useLocation
 * - useHistory().push
 */
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useLocation: jest.fn(),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

// mocks of `react-router-dom` wrapped in `mocked()` util form `ts-jest` for type compatibility
const mockUseParams = mocked(useParams);
const mockUseLocation = mocked(useLocation);

// default date we'll be passing as a `defaultDate` prop to `DateNavigation` component
const defaultDateISO = __storybookDate__;
const defaultDate = DateTime.fromISO(defaultDateISO);

// router date we'll be passing as `date` property on `useParams()` return interface
const routerTestDateISO = "2021-01-01";
const routerTestDate = DateTime.fromISO(routerTestDateISO);

// a dummy path location we'll be using to test pushing updated path on pagination
const testPath = `/location/${routerTestDateISO}`;
/** @TODO fix this any assertion */
mockUseLocation.mockReturnValue({ pathname: testPath } as any);

describe("Date Navigation", () => {
  describe("Test main functionality (date) with router", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      cleanup();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("should try and read date from router", () => {
      mockUseParams.mockReturnValue({ date: routerTestDateISO });
      render(
        <DateNavigation withRouter jump="day">
          {({ currentViewStart }) => luxon2ISODate(currentViewStart)}
        </DateNavigation>
      );
      screen.getByText(routerTestDateISO);
    });

    test("fault tolerance: should fall back to default value if date value in the path is not a valid ISO date string", () => {
      mockUseParams.mockImplementation(() => ({ date: "2021-01-01" }));
      const notISOdate = "not_iso_date";
      mockUseParams.mockReturnValue({ date: notISOdate });
      render(
        <DateNavigation withRouter jump="day" defaultDate={defaultDate}>
          {({ currentViewStart }) => luxon2ISODate(currentViewStart)}
        </DateNavigation>
      );
      screen.getByText(defaultDateISO);
    });

    test("edge case: should ignore route date (and use default value) if route date is provided, but not in the 'withRouter' mode", () => {
      mockUseParams.mockImplementation(() => ({ date: "2021-01-01" }));
      mockUseParams.mockReturnValue({ date: routerTestDateISO });
      render(
        <DateNavigation jump="day" defaultDate={defaultDate}>
          {({ currentViewStart }) => luxon2ISODate(currentViewStart)}
        </DateNavigation>
      );
      screen.getByText(defaultDateISO);
    });

    test("on date view switch, should `history.push()` the same path with new date param", () => {
      mockUseParams.mockReturnValue({ date: routerTestDateISO });
      render(<DateNavigation withRouter jump="day" />);
      const nextDate = routerTestDate.plus({ days: 1 });
      const nextDateISO = luxon2ISODate(nextDate);
      const newRoute = `/location/${nextDateISO}`;
      screen.getByTestId(__dateNavNextId__).click();
      expect(mockHistoryPush).toHaveBeenCalledWith(newRoute);
    });

    test("if no date path param provided, should push default date (to synchronize route and local state)", () => {
      mockUseParams.mockReturnValue({ date: undefined });
      mockUseLocation.mockReturnValue({ pathname: "/location" } as any);
      // to 'shake things up a bit' we'll be using "week" as a `jump` value and a date which isn't a start of it's week
      // we're expecting the safe default date (corrected to the start of the timeframe) to be pushed to the route
      // the `notWeekStart` is a tuesday and the monday of the same week is our 'defaultDate' used throughout the suite
      const notWeekStart = DateTime.fromISO(defaultDateISO).plus({
        days: 1,
      });
      render(
        <DateNavigation withRouter jump="week" defaultDate={notWeekStart} />
      );
      const locationWithDefaultDate = `/location/${defaultDateISO}`;
      expect(mockHistoryPush).toHaveBeenCalledWith(locationWithDefaultDate);
    });
  });
});
