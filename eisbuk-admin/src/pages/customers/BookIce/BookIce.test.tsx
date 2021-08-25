import React from "react";
import { screen, render, cleanup } from "@testing-library/react";
import { DateTime } from "luxon";

import BookIce from "../BookIce";

import { luxon2ISODate } from "@/utils/date";

import { __dateNavNextId__ } from "@/__testData__/testIds";

// mock date we'll be using throughout tests
const testDateISO = "2021-03-01";
const testDate = DateTime.fromISO(testDateISO);

// test string for users secret key
const testSecret = "test-secret-key";

/**
 * Mock function we'll be using to test `react-router`'s `history.push`
 */
const mockHistoryPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => ({ push: mockHistoryPush }),
  useParams: () => ({
    date: "2021-03-01",
    secret_key: "test-secret-key",
  }),
  useLocation: () => ({ pathname: "/customers/test-secret-key/2021-03-01" }),
}));

describe("BookIce", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("Test pagination", () => {
    test("should paginate by month when next button is clicked", () => {
      render(<BookIce />);
      screen.getByTestId(__dateNavNextId__).click();
      // we're expecting next date to be a month jump from our first date
      const expectedDate = testDate.plus({ month: 1 });
      const expectedDateISO = luxon2ISODate(expectedDate);
      // apply expected date to create an expected route
      const expectedNewRoute = `/customers/${testSecret}/${expectedDateISO}`;
      expect(mockHistoryPush).toHaveBeenCalledWith(expectedNewRoute);
    });
  });

  describe("Test booking actions", () => {
    test("should subscribe to given slot on click", () => {
      render(<BookIce >{() => }</BookIce>);
      screen.getByTestId(__dateNavNextId__).click();
      // we're expecting next date to be a month jump from our first date
      const expectedDate = testDate.plus({ month: 1 });
      const expectedDateISO = luxon2ISODate(expectedDate);
      // apply expected date to create an expected route
      const expectedNewRoute = `/customers/${testSecret}/${expectedDateISO}`;
      expect(mockHistoryPush).toHaveBeenCalledWith(expectedNewRoute);
    });
  });
});
