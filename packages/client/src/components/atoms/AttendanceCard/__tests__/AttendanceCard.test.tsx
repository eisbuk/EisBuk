/**
 * @jest-environment jsdom
 */

import React from "react";
import { cleanup, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import i18n, {
  AttendanceAria,
  CategoryLabel,
  SlotTypeLabel,
} from "@eisbuk/translations";

import "@/__testSetup__/firestoreSetup";

import { CustomerWithAttendance } from "@/types/components";

import AttendanceCard from "../AttendanceCard";

import * as attendanceOperations from "@/store/actions/attendanceOperations";

import { comparePeriods } from "@/utils/sort";

import { renderWithRouter } from "@/__testUtils__/wrappers";

import { baseAttendanceCard, intervals } from "@/__testData__/attendance";
import { gus, saul, walt } from "@/__testData__/customers";
import { baseSlot } from "@/__testData__/slots";

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
const mockMarkAttImplementation = (
  payload: Parameters<typeof attendanceOperations.markAttendance>[0]
) => ({
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
const mockMarkAbsImplementation = (
  payload: Parameters<typeof attendanceOperations.markAbsence>[0]
) => ({
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

const slotId = baseAttendanceCard.id;

const shortSaul = {
  customerId: saul.id,
  name: saul.name,
  surname: saul.surname,
};

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
      renderWithRouter(
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
      renderWithRouter(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval: null }]}
        />
      );
      screen.getByText(thumbsDown).click();
      expect(screen.queryByText(thumbsDown)).toBeNull();
      screen.getByText(thumbsUp);
    });

    test("should dispatch 'markAttendance' on attendance button click if `attended = null` (and default to booked interval if no interval was specified)", () => {
      renderWithRouter(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval: null }]}
        />
      );
      screen.getByText(thumbsDown).click();
      expect(mockDispatch).toHaveBeenCalledWith(
        mockMarkAttImplementation({
          slotId,
          ...shortSaul,
          attendedInterval: bookedInterval,
        })
      );
    });

    test("should dispatch 'markAbsence' on attendance button click if `attended != null`", () => {
      renderWithRouter(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval }]}
        />
      );
      screen.getByText(thumbsUp).click();
      expect(mockDispatch).toHaveBeenCalledWith(
        mockMarkAbsImplementation({
          ...shortSaul,
          slotId,
        })
      );
    });

    test("should disable attendance button while there's a discrepency between local attended and attended from firestore (boolean)", () => {
      renderWithRouter(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval }]}
        />
      );
      screen.getByText(thumbsUp).click();
      // we've created a discrepency by updating local state, while attendance from props stayed the same
      expect(screen.getByText(thumbsDown)).toHaveProperty("disabled", true);
    });

    test("should disable attendance button while picking new interval - 'attendedInterval != selectedInterval' (this doesn't apply when 'attendedInterval = null'", () => {
      renderWithRouter(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval }]}
        />
      );
      screen
        .getByRole("button", { name: i18n.t(AttendanceAria.NextInterval) })
        .click();
      // we've created a discrepency by updating local state, while attendedInterval from props stayed the same
      expect(screen.getByText(thumbsUp)).toHaveProperty("disabled", true);
    });
  });

  describe("Test interval picker ->", () => {
    beforeEach(() => {
      renderWithRouter(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[{ ...saul, bookedInterval, attendedInterval }]}
        />
      );
    });

    test("should show booked interval (if any) when the attended and booked interval are different", () => {
      cleanup();
      renderWithRouter(
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
      screen
        .getByRole("button", { name: i18n.t(AttendanceAria.NextInterval) })
        .click();
      screen.getByText(attendedInterval);
      screen.getByText(bookedInterval);
    });

    test("should disable prev button if first interval selected and next if last selected", () => {
      const prevButton = screen.getByRole("button", {
        name: i18n.t(AttendanceAria.PreviousInterval),
      });
      const nextButton = screen.getByRole("button", {
        name: i18n.t(AttendanceAria.NextInterval),
      });
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
      const prevButton = screen.getByRole("button", {
        name: "Previous interval",
      });
      const nextButton = screen.getByRole("button", {
        name: i18n.t(AttendanceAria.NextInterval),
      });
      expect(prevButton).toHaveProperty("disabled", true);
      expect(nextButton).toHaveProperty("disabled", true);
    });

    test("should dispatch 'markAttendance' on change of interval", async () => {
      screen
        .getByRole("button", { name: i18n.t(AttendanceAria.NextInterval) })
        .click();
      const mockDispatchAction = mockMarkAttImplementation({
        ...shortSaul,
        slotId,
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
      renderWithRouter(
        <AttendanceCard
          {...baseAttendanceCard}
          customers={[
            { ...saul, bookedInterval, attendedInterval: bookedInterval },
          ]}
        />
      );
      jest.clearAllMocks();
      // we're testing with first interval as initial
      const nextButton = screen.getByRole("button", {
        name: i18n.t(AttendanceAria.NextInterval),
      });
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
        ...shortSaul,
        slotId,
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

      renderWithRouter(<AttendanceCard {...attendanceCard} />);

      screen
        .getByRole("button", {
          name: i18n.t(AttendanceAria.AddAttendedCustomers) as string,
        })
        .click();
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
});

const hold = (timeout: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeout);
  });
