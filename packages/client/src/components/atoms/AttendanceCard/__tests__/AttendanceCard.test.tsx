/**
 * @jest-environment jsdom
 */

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Customer, SlotInterface } from "@eisbuk/shared";
import i18n, { CategoryLabel, SlotTypeLabel } from "@eisbuk/translations";

import "@/__testSetup__/firestoreSetup";

import { CustomerWithAttendance } from "@/types/components";

import AttendanceCard from "../AttendanceCard";

import * as attendanceOperations from "@/store/actions/attendanceOperations";

import { comparePeriods } from "@/utils/sort";

import { testWithEmulator } from "@/__testUtils__/envUtils";

import { baseAttendanceCard, intervals } from "@/__testData__/attendance";
import { gus, saul, walt } from "@/__testData__/customers";
import { baseSlot } from "@/__testData__/slots";
import {
  __addCustomersButtonId__,
  __attendanceButton__,
  __nextIntervalButtonId__,
  __prevIntervalButtonId__,
} from "../__testData__/testIds";

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

// aliases for thumbs button for easier access
const thumbsUp = "👍";
const thumbsDown = "👎";
// const trashCan = "🗑️";

const customerId = saul.id;
const slotId = baseAttendanceCard.id;

// interval values we're using across tests
const intervalKeys = Object.keys(intervals).sort(comparePeriods);
const bookedInterval = intervalKeys[0];
// we're using different interval then booked for more versatile tests
const attendedInterval = intervalKeys[1];

// provide a polyfill for element.animate function
if (typeof Element.prototype.animate !== "function") {
  // we won't be testing the animate function. We just need it to not fail the tests
  // therefore an empty function will suffice
  Element.prototype.animate = () => Object.create({});
}

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
        i18n.t(CategoryLabel[baseAttendanceCard.categories[0]]),
        "i"
      );
      const typeRegex = new RegExp(
        i18n.t(SlotTypeLabel[baseAttendanceCard.type]),
        "i"
      );
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

    test("should show booked interval (if any) when the attended and booked interval are different", () => {
      cleanup();
      render(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[
            { ...saul, bookedInterval, attendedInterval: bookedInterval },
          ]}
        />
      );
      // only one interval should be shown in case both booked and attended are the same
      const displayedIntervals = screen.queryAllByText(bookedInterval);
      expect(displayedIntervals).toHaveLength(1);
      screen.getByTestId(__nextIntervalButtonId__).click();
      screen.getByText(attendedInterval);
      screen.getByText(bookedInterval);
    });

    test("should disable prev button if first interval selected and next if last selected", () => {
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

    test("should dispatch 'markAttendance' on change of interval", async () => {
      screen.getByTestId(__nextIntervalButtonId__).click();
      const mockDispatchAction = mockMarkAttImplementation({
        slotId,
        customerId,
        attendedInterval: intervalKeys[2],
      });
      await waitFor(() =>
        expect(mockDispatch).toHaveBeenCalledWith(mockDispatchAction)
      );
    });

    test("should display booked interval when customer marked as absent", () => {
      // initial state -> intervals are different, two interval strings are shown
      screen.getByText(bookedInterval);
      screen.getByText(attendedInterval);
      // mark absence
      screen.getByText(thumbsUp).click();
      expect(screen.queryByText(attendedInterval)).toBeNull();
      screen.getByText(bookedInterval);
    });
  });

  describe("Test debounce", () => {
    test("should only dispatch interval update once if changes are to close to each other", async () => {
      render(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[
            { ...saul, bookedInterval, attendedInterval: bookedInterval },
          ]}
        />
      );
      jest.clearAllMocks();
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
    });
  });

  describe("Test opening AddAttendedCustomersDialog modal", () => {
    test("should open an 'AddAttendedCustomers' modal on 'Add Customers' click", () => {
      const testSlot = {
        ...baseSlot,
        // We're using only one interval for simplicity's sake
        intervals: {
          ["10:00-11:00"]: {
            startTime: "10:00",
            endTime: "11:00",
          },
        },
      };

      const attendanceCard = {
        ...testSlot,
        allCustomers: [saul, walt, gus],
        // We wish for all customers in the 'allCustomers' array to be eligible for this slot
        categories: [
          ...new Set([
            ...saul.categories,
            ...walt.categories,
            ...gus.categories,
          ]),
        ],
        // We want gus to get filtered out when opening 'AddAttendedCustomersDialog'
        customers: [
          {
            ...gus,
            bookedInterval: null,
            attendedInterval: "10:00-11:00",
          } as CustomerWithAttendance,
        ],
      };

      render(<AttendanceCard {...attendanceCard} />);

      screen.getByTestId(__addCustomersButtonId__).click();
      const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
      expect(dispatchCallPayload.component).toEqual(
        "AddAttendedCustomersDialog"
      );
      expect(dispatchCallPayload.props).toEqual({
        ...testSlot,
        customers: [saul, walt],
        defaultInterval: "10:00-11:00",
      });
    });
  });

  // we're testing for an edge case when two users have the app open in their browsers
  // and both apps should work the same, avoiding dispcrpencies, such as disabling the attendance
  // button on one if the other has updated attendance
  /**
   * This is temporarily skipped as it requires both MutationObserver and firestore emulators
   * @TODO udpate this when such operations are possible
   */
  xdescribe("Test syncronization on multiple views", () => {
    testWithEmulator(
      "should update attendance on both views, without disabling any",
      async () => {
        const intervals = {
          ["09:00-10:00"]: {
            startTime: "09:00",
            endTime: "10:00",
          },
          ["09:00-10:30"]: {
            startTime: "09:00",
            endTime: "10:30",
          },
        };
        const saulWithAttendandce: CustomerWithAttendance = {
          ...saul,
          attendedInterval: "09:00-10:00",
          bookedInterval: "09:00-10:00",
        };
        const testProps = {
          ...baseSlot,
          intervals,
          customers: [saulWithAttendandce],
          allCustomers: [],
        };
        // we're rendering two views one to interact with one
        // for opservation of the updates
        render(
          <>
            <AttendanceCard {...testProps} />
            <AttendanceCard {...testProps} />
          </>
        );
        const [controlledButton, testButton] =
          screen.getAllByTestId(__attendanceButton__);
        // check that both buttons are the same to begin with
        expect(controlledButton).toHaveTextContent(thumbsUp);
        expect(testButton).toHaveTextContent(thumbsUp);
        // update one attendance (boolean) state and expect the other to get updated
        controlledButton.click();
        expect(controlledButton).toHaveTextContent(thumbsDown);
        await waitFor(() => {
          expect(testButton).toHaveTextContent(thumbsDown);
        });
      }
    );
  });
});

const hold = (timeout: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeout);
  });
