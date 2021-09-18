import React from "react";
import { screen, render, cleanup } from "@testing-library/react";
import { DateTime } from "luxon";

import { CustomerBookingEntry } from "eisbuk-shared";

import { CustomerRoute } from "@/enums/routes";

import { slotsLabels } from "@/config/appConfig";

import CustomerSlots from "../CustomerSlots";

import * as bookingActions from "@/store/actions/bookingOperations";

import { luxon2ISODate } from "@/utils/date";

import { __dateNavNextId__ } from "@/__testData__/testIds";

import { slotsMonth } from "@/__testData__/dummyData";

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
 * Mock function we'll be using to test dispatching to the store
 */
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

xdescribe("CustomerSlots", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("Test pagination", () => {
    test("should paginate by month if 'view=\"book_ice\"'", () => {
      render(<CustomerSlots slots={slotsMonth} view={CustomerRoute.BookIce} />);
      screen.getByTestId(__dateNavNextId__).click();
      // we're expecting next date to be a month jump from our first date
      const expectedDate = testDate.plus({ month: 1 });
      const expectedDateISO = luxon2ISODate(expectedDate);
      // apply expected date to create an expected route
      const expectedNewRoute = `/customers/${testSecret}/${expectedDateISO}`;
      expect(mockHistoryPush).toHaveBeenCalledWith(expectedNewRoute);
    });

    test("should paginate by week if 'view=\"book_off_ice\"'", () => {
      render(
        <CustomerSlots slots={slotsMonth} view={CustomerRoute.BookOffIce} />
      );
      screen.getByTestId(__dateNavNextId__).click();
      // we're expecting next date to be a month jump from our first date
      const expectedDate = testDate.plus({ week: 1 });
      const expectedDateISO = luxon2ISODate(expectedDate);
      // apply expected date to create an expected route
      const expectedNewRoute = `/customers/${testSecret}/${expectedDateISO}`;
      expect(mockHistoryPush).toHaveBeenCalledWith(expectedNewRoute);
    });
  });

  describe("Test booking actions", () => {
    // we're passing a slot month (for type safety), but we'll be testing actions only on the first slot
    const testSlotId = "slot-0";
    const testSlot = slotsMonth["2021-03-01"][testSlotId];

    // mock implementations for `subscribeToSlot` and `unsubscribeFromSlot`
    // we'll be using those implementations to easier test dispatching to store with appropriate actions
    // as well as mocking implementations of asid functions within the component
    const mockSubscribeImplementation = (
      bookingId: string,
      bookingInfo: CustomerBookingEntry
    ) => ({ action: "subscribe", bookingId, bookingInfo });
    const mockUnsubscribeImplementation = (
      bookingId: string,
      slotId: string
    ) => ({ action: "unsubscribe", bookingId, slotId });

    // apply mock implenetations to component
    jest
      .spyOn(bookingActions, "subscribeToSlot")
      .mockImplementation(mockSubscribeImplementation as any);
    jest
      .spyOn(bookingActions, "unsubscribeFromSlot")
      .mockImplementation(mockUnsubscribeImplementation as any);

    test("should subscribe to given slot (and a given duration) on click", () => {
      // we try subscribing to the first available duration of the first slot
      const testDuration = testSlot.durations[0];
      const testDurationLabel = slotsLabels.durations[testDuration].label;
      render(<CustomerSlots slots={slotsMonth} />);
      // we're looking for first occurence of said duration
      // (as there will be another slots with given duration available)
      const durationButtonOnScreen = screen.queryAllByText(
        testDurationLabel
      )[0];
      durationButtonOnScreen.click();
      // createa mock redux action to test dispatch being called with proper data
      const mockSubscribeAction = mockSubscribeImplementation(testSecret, {
        ...testSlot,
        duration: testDuration,
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockSubscribeAction);
    });

    test("should unsubscribe from duration on click if that duration is subscribed to", () => {
      // we'll be using the first duration from test slot as subscribed duration
      const subscribedDuration = testSlot.durations[0];
      const subscribedSlots = { [testSlotId]: subscribedDuration };
      render(<CustomerSlots slots={slotsMonth} {...{ subscribedSlots }} />);
      const testDurationLabel = slotsLabels.durations[subscribedDuration].label;
      // we're looking for first occurence of said duration
      // (as there will be another slots with given duration available)
      const durationButtonOnScreen = screen.queryAllByText(
        testDurationLabel
      )[0];
      durationButtonOnScreen.click();
      // createa mock redux action to test dispatch being called with proper data
      const mockUnubscribeAction = mockUnsubscribeImplementation(
        testSecret,
        testSlot.id
      );
      expect(mockDispatch).toHaveBeenCalledWith(mockUnubscribeAction);
    });
  });
});
