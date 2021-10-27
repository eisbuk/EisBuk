import React from "react";
import i18n from "i18next";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Customer, SlotInterface } from "eisbuk-shared";

import { CustomerWithAttendance } from "@/types/components";

import { categoryLabel, slotTypeLabel } from "@/lib/labels";

import AttendanceCard from "../AttendanceCard";

import * as attendanceOperations from "@/store/actions/attendanceOperations";

import { baseAttendanceCard, intervals } from "@/__testData__/attendance";
import { saul } from "@/__testData__/customers";
import {
  __attendanceButton__,
  __nextIntervalButtonId__,
  __prevIntervalButtonId__,
} from "../__testData__/testIds";
import { testWithMutationObserver } from "@/__testUtils__/envUtils";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

/**
 * Mock implementation we're using for `markAttendnace` function to both
 * mock behavior in calls within the component as well as easier test calling the function with proper values
 *
 * Note: this function behaves differently in production
 * @param payload
 * @returns
 */
const mockMarkAttImplementation = (payload: {
  slotId: SlotInterface["id"];
  customerId: Customer["id"];
  attendedInterval: string;
}) => ({
  payload,
});
/**
 * Mock implementation we're using for `markAbsence` function to both
 * mock behavior in calls within the component as well as easier test calling the function with proper values
 *
 * Note: this function behaves differently in production
 * @param payload
 * @returns payload
 */
const mockMarkAbsImplementation = (payload: {
  slotId: SlotInterface["id"];
  customerId: Customer["id"];
}) => ({
  payload,
});

// mock implementations of attendance operations for easier testing
jest
  .spyOn(attendanceOperations, "markAttendance")
  .mockImplementation(mockMarkAttImplementation as any);

jest
  .spyOn(attendanceOperations, "markAbsence")
  .mockImplementation(mockMarkAbsImplementation as any);

/**
 * We're mocking the implementation of translate function to return the same value passed in.
 * We're not testing the i18n right now
 * @TODO remove when we initialize i18n with tests
 */
jest.spyOn(i18n, "t").mockImplementation(((str: string) => str) as any);

// aliases for thumbs button for easier access
const thumbsUp = "👍";
const thumbsDown = "👎";
const trashCan = "🗑️";

const customerId = saul.id;
const slotId = baseAttendanceCard.id;

// interval values we're using across tests
const intervalKeys = Object.keys(intervals);
const bookedInterval = intervalKeys[0];
// we're using different interval then booked for more versatile tests
const attendedInterval = intervalKeys[1];

describe("AttendanceCard", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("Smoke test", () => {
    test("should render proper values passed from props", () => {
      render(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[saul as CustomerWithAttendance]}
        />
      );

      screen.getByText("13:00 - 14:15");
      screen.getByText(`${saul.name} ${saul.surname}`);
      // create regex for type and category as they're part of the same string in the UI
      const categoryRegex = new RegExp(
        categoryLabel[baseAttendanceCard.categories[0]]
      );
      const typeRegex = new RegExp(slotTypeLabel[baseAttendanceCard.type]);
      screen.getByText(categoryRegex);
      screen.getByText(typeRegex);
    });
  });

  describe("Test marking attendance functionality", () => {
    test("should update local state immediately on button click", () => {
      render(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval: null }]}
        />
      );
      screen.getByText(thumbsDown).click();
      expect(screen.queryByText(thumbsDown)).toBeNull();
      screen.getByText(thumbsUp);
    });
    /** @TODO revisit this when migration from CRA is done */
    xtest("should display a trash can icon when marking a non-booked athlete as absent", () => {
      // test implementation here
    });

    test("should dispatch 'markAttendance' on attendance button click if `attended = null` (and default to booked interval if no interval was specified)", () => {
      render(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval: null }]}
        />
      );
      screen.getByText(thumbsDown).click();
      expect(mockDispatch).toHaveBeenCalledWith(
        mockMarkAttImplementation({
          slotId,
          customerId,
          attendedInterval: bookedInterval,
        })
      );
    });

    test("should dispatch 'markAbsence' on attendance button click if `attended != null`", () => {
      render(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval }]}
        />
      );
      screen.getByText(thumbsUp).click();
      expect(mockDispatch).toHaveBeenCalledWith(
        mockMarkAbsImplementation({
          slotId,
          customerId,
        })
      );
    });

    test("should disable attendance button while there's a discrepency between local attended and attended from firestore (boolean)", () => {
      render(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval }]}
        />
      );
      screen.getByText(thumbsUp).click();
      // we've created a discrepency by updating local state, while attendance from props stayed the same
      expect(screen.getByTestId(__attendanceButton__)).toHaveProperty(
        "disabled",
        true
      );
    });

    test("should disable attendance button while picking new interval - 'attendedInterval != selectedInterval' (this doesn't apply when 'attendedInterval = null'", () => {
      render(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval }]}
        />
      );
      screen.getByTestId(__nextIntervalButtonId__).click();
      // we've created a discrepency by updating local state, while attendedInterval from props stayed the same
      expect(screen.getByTestId(__attendanceButton__)).toHaveProperty(
        "disabled",
        true
      );
    });
  });

  describe("Test interval picker ->", () => {
    beforeEach(() => {
      render(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval }]}
        />
      );
    });

    test("should show selected interval in interval field", () => {
      // for UI purposes, we're displaying interval within (controlled) disabled text field
      const intervalField = screen.getByRole("textbox");
      expect(intervalField).toHaveProperty("value", attendedInterval);
    });

    test("should disable prev button if first interval selected and next if las selected", () => {
      const prevButton = screen.getByTestId(__prevIntervalButtonId__);
      const nextButton = screen.getByTestId(__nextIntervalButtonId__);
      // buttons shouldn't be disabled as we're starting with middle interval
      expect(prevButton).not.toHaveProperty("disabled", true);
      // switch to first interval
      prevButton.click();
      expect(prevButton).toHaveProperty("disabled", true);
      expect(nextButton).not.toHaveProperty("disabled", true);
      // switch to last interval (there are 3 in total)
      nextButton.click();
      nextButton.click();
      expect(prevButton).not.toHaveProperty("disabled", true);
      expect(nextButton).toHaveProperty("disabled", true);
    });

    test("should disable the interval picker if 'localAttended = false'", () => {
      // set local attendance to false
      screen.getByText(thumbsUp).click();
      const prevButton = screen.getByTestId(__prevIntervalButtonId__);
      const nextButton = screen.getByTestId(__nextIntervalButtonId__);
      expect(prevButton).toHaveProperty("disabled", true);
      expect(nextButton).toHaveProperty("disabled", true);
    });

    testWithMutationObserver(
      "should dispatch 'markAttendance' on change of interval",
      async () => {
        screen.getByTestId(__nextIntervalButtonId__).click();
        const mockDispatchAction = mockMarkAttImplementation({
          slotId,
          customerId,
          attendedInterval: intervalKeys[2],
        });
        await waitFor(() =>
          expect(mockDispatch).toHaveBeenCalledWith(mockDispatchAction)
        );
      }
    );
  });

  describe("Test debounce", () => {
    testWithMutationObserver(
      "should only dispatch interval update once if changes are to close to each other",
      async () => {
        render(
          <AttendanceCard
            {...baseAttendanceCard}
            customers={[
              { ...saul, bookedInterval, attendedInterval: bookedInterval },
            ]}
          />
        );
        // we're testing with first interval as initial
        const nextButton = screen.getByTestId(__nextIntervalButtonId__);
        // selectedInterval -> interval[1]
        nextButton.click();
        expect(mockDispatch).toHaveBeenCalledTimes(0);
        await hold(200);
        expect(mockDispatch).toHaveBeenCalledTimes(0);
        // selectedInterval -> interval[2]
        nextButton.click();
        await hold(1000);
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        // final interval = interval[2]
        const mockDispatchAction = mockMarkAttImplementation({
          slotId,
          customerId,
          attendedInterval: intervalKeys[2],
        });
        expect(mockDispatch).toHaveBeenCalledWith(mockDispatchAction);
      }
    );
  });
});

const hold = (timeout: number) =>
  new Promise<void>((res) => {
    setTimeout(() => res(), timeout);
  });
