/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test } from "vitest";
import { screen } from "@testing-library/react";

import i18n, { AttendanceAria } from "@eisbuk/translations";
import { CustomerWithAttendance } from "@eisbuk/shared";

import "@/__testSetup__/firestoreSetup";

import AttendanceCard from "../AttendanceCardController";

import * as attendanceOperations from "@/store/actions/attendanceOperations";

import { renderWithRouter } from "@/__testUtils__/wrappers";

import { gus, saul, walt } from "@eisbuk/testing/customers";
import { baseSlot } from "@eisbuk/testing/slots";

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
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
vi.spyOn(attendanceOperations, "markAttendance").mockImplementation(
  mockMarkAttImplementation as any
);

vi.spyOn(attendanceOperations, "markAbsence").mockImplementation(
  mockMarkAbsImplementation as any
);

// provide a polyfill for element.animate function
if (typeof Element.prototype.animate !== "function") {
  // we won't be testing the animate function. We just need it to not fail the tests
  // therefore an empty function will suffice
  Element.prototype.animate = () => Object.create({});
}

describe("AttendanceCard", () => {
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
        ...{ ...testSlot, categories: attendanceCard.categories },
        customers: [saul, walt],
        defaultInterval: "10:00-11:00",
      });
    });
  });
});
