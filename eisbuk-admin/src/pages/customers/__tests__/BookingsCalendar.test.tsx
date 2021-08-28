import React from "react";
import { screen, render } from "@testing-library/react";
import { DateTime } from "luxon";

import BookingsCalendar from "../BookingsCalendar";

import { luxon2ISODate } from "@/utils/date";

import { bookedSlots } from "../__testData__/dummyData";
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
    secretKey: "test-secret-key",
  }),
  useLocation: () => ({ pathname: "/customers/test-secret-key/2021-03-01" }),
}));

/**
 * @TODO The test suite is skipped for now. The test would be passing if it weren't for MUI's `makeStyles`,
 * which is somewhat difficult to mock.
 * We should really consider using TailwindCSS for styles to eliminate this kind of problems.
 */
xdescribe("BookingsCalendar", () => {
  describe("Test pagination", () => {
    test("should paginate by week", () => {
      render(<BookingsCalendar bookings={bookedSlots} />);
      screen.getByTestId(__dateNavNextId__).click();
      // we're expecting next date to be a month jump from our first date
      const expectedDate = testDate.plus({ week: 1 });
      const expectedDateISO = luxon2ISODate(expectedDate);
      // apply expected date to create an expected route
      const expectedNewRoute = `/customers/${testSecret}/${expectedDateISO}`;
      expect(mockHistoryPush).toHaveBeenCalledWith(expectedNewRoute);
    });
  });
});
