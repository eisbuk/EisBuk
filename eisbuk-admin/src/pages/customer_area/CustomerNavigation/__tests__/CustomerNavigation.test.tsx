/**
 * @jest-environment jsdom-sixteen
 */
import React from "react";
import { screen, render, cleanup } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { mocked } from "ts-jest/utils";

import { CustomerRoute } from "@/enums/routes";

import CustomerNavigation from "../CustomerNavigation";

import {
  __bookIceButtonId__,
  __bookOffIceButtonId__,
  __calendarButtonId__,
} from "../__testData__/testIds";

/**
 * A mock function we're using to spy on `history.push` usage
 */
const mockHistoryPush = jest.fn();
const mockHistoryReplace = jest.fn();
jest.mock("react-router-dom", () => ({
  useLocation: jest.fn(),
  useHistory: () => ({
    push: mockHistoryPush,
    replace: mockHistoryReplace,
  }),
}));

/**
 * A function we'll be using to provide pathname for testing (by mocking `react-router-dom`s `useLocation`)
 */
const mockUseLocation = mocked(useLocation);

describe("CustomerNavigation", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("Test routing", () => {
    test("should push to proper route on click", () => {
      // we're testing these in vacuum
      // in production there should always be some other part of route other than `customerRoute`
      render(<CustomerNavigation />);
      screen.getByTestId(__bookIceButtonId__).click();
      expect(mockHistoryPush).toHaveBeenCalledWith(`/${CustomerRoute.BookIce}`);
      screen.getByTestId(__bookOffIceButtonId__).click();
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `/${CustomerRoute.BookOffIce}`
      );
      screen.getByTestId(__calendarButtonId__).click();
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `/${CustomerRoute.Calendar}`
      );
    });

    test("should only change the customer route part, leaving rest of the route the same", () => {
      // we're using a most random test route and expecting only the customer route part to be different on click
      const testRoute = `/some_string/${CustomerRoute.BookIce}/some_other_string`;
      mockUseLocation.mockReturnValue({ pathname: testRoute } as any);
      render(<CustomerNavigation />);
      screen.getByTestId(__bookOffIceButtonId__).click();
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `/some_string/${CustomerRoute.BookOffIce}/some_other_string`
      );
    });

    test("button should be disabled if the route is already active", () => {
      const testRoute = `/some_string/${CustomerRoute.BookIce}/some_other_string`;
      mockUseLocation.mockReturnValue({ pathname: testRoute } as any);
      render(<CustomerNavigation />);
      const bookIceButton = screen.getByTestId(__bookIceButtonId__);
      expect(bookIceButton).toHaveProperty("disabled", true);
    });

    test("should redirect to 'book_ice' if no 'customerRoute' part is present in 'pathname' (using replace rather than push to enable back navigation) ", () => {
      const testRoute = `/some_string/some_other_string`;
      mockUseLocation.mockReturnValue({ pathname: testRoute } as any);
      render(<CustomerNavigation />);
      expect(mockHistoryReplace).toHaveBeenCalledWith(
        [testRoute, CustomerRoute.BookIce].join("/")
      );
    });
  });
});
