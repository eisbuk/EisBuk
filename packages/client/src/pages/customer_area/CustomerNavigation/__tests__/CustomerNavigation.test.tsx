/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { mocked } from "ts-jest/utils";

import i18n, { CustomerNavigationLabel } from "@eisbuk/translations";

import { CustomerRoute } from "@/enums/routes";

import CustomerNavigation from "../CustomerNavigation";

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

// traslated button labels
const bookIceLabel = i18n.t(
  CustomerNavigationLabel[CustomerRoute.BookIce]
) as string;
const bookOffIceLabel = i18n.t(
  CustomerNavigationLabel[CustomerRoute.BookOffIce]
) as string;
const calendarLabel = i18n.t(
  CustomerNavigationLabel[CustomerRoute.Calendar]
) as string;

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
      screen.getByText(bookIceLabel).click();
      expect(mockHistoryPush).toHaveBeenCalledWith(`/${CustomerRoute.BookIce}`);
      screen.getByText(bookOffIceLabel).click();
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `/${CustomerRoute.BookOffIce}`
      );
      screen.getByText(calendarLabel).click();
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `/${CustomerRoute.Calendar}`
      );
    });

    test("should only change the customer route part, leaving rest of the route the same", () => {
      // we're using a most random test route and expecting only the customer route part to be different on click
      const testRoute = `/some_string/${CustomerRoute.BookIce}/some_other_string`;
      mockUseLocation.mockReturnValue({ pathname: testRoute } as any);
      render(<CustomerNavigation />);
      screen.getByText(bookOffIceLabel).click();
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `/some_string/${CustomerRoute.BookOffIce}/some_other_string`
      );
    });

    test("button should be disabled if the route is already active", () => {
      const testRoute = `/some_string/${CustomerRoute.BookIce}/some_other_string`;
      mockUseLocation.mockReturnValue({ pathname: testRoute } as any);
      render(<CustomerNavigation />);
      const bookIceButton = screen.getAllByRole("tab")[0];
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
