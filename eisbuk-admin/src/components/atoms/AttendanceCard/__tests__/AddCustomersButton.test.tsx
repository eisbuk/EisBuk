import React from "react";
import {
  screen,
  render,
  waitForElementToBeRemoved,
  cleanup,
} from "@testing-library/react";

import { Customer } from "eisbuk-shared";

import { SlotInterface } from "@/types/temp";

import AttendnaceCard from "../AttendanceCard";

import * as attendanceOperations from "@/store/actions/attendanceOperations";

import { testWithMutationObserver } from "@/__testUtils__/envUtils";

import {
  baseProps,
  saul,
  intervalStrings as intervals,
  walt,
} from "../__testData__/dummyData";
import {
  __addCustomersButtonId__,
  __closeCustomersListId__,
  __customersListId__,
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
 * @TODO This is a duplicate and should probably be imported from test utils
 */
const mockMarkAttImplementation = (payload: {
  slotId: SlotInterface["id"];
  customerId: Customer["id"];
  attendedInterval: string;
}) => ({
  payload,
});

// mock implementations of attendance operations for easier testing
jest
  .spyOn(attendanceOperations, "markAttendance")
  .mockImplementation(mockMarkAttImplementation as any);

// test data
const { id: slotId } = baseProps;

describe("AttendanceCard ->", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe("AddCustomersList ->", () => {
    // attendance data we're using for customer marked as having attended
    const customerAttendance = {
      bookedInterval: intervals[0],
      attendedInterval: intervals[0],
    };
    const saulWithAttendance = { ...saul, ...customerAttendance };

    testWithMutationObserver(
      'should open customers list on add customers button click and close on "x" button click',
      async () => {
        render(<AttendnaceCard {...baseProps} />);
        const customerList = screen.queryByTestId(__customersListId__);
        expect(customerList).toBeNull();
        screen.getByTestId(__addCustomersButtonId__).click();
        screen.getByTestId(__customersListId__);
        screen.getByTestId(__closeCustomersListId__).click();
        await waitForElementToBeRemoved(() =>
          screen.getByTestId(__customersListId__)
        );
      }
    );

    test("should render all customers for slot's category who haven't booked already (when open)", () => {
      render(
        <AttendnaceCard {...baseProps} customers={[saulWithAttendance]} />
      );
      screen.getByTestId(__addCustomersButtonId__).click();
      const waltRegex = new RegExp(walt.name);
      // should render walt -> category: "course", not within attended customers
      screen.getByText(waltRegex);
      const customerList = screen.getByTestId(__customersListId__);
      // should have only two children (`walt` and `jian`) as `saul` has already been marked as attended, and `gus` doesn't belong to the category
      expect(customerList.children.length).toEqual(2);
    });

    test("should remove customer from list and add to attended customers on click", () => {
      render(<AttendnaceCard {...baseProps} />);
      screen.getByTestId(__addCustomersButtonId__).click();
      const customerList = screen.getByTestId(__customersListId__);
      // should have two customers: walt and saul (both `course`, none attended)
      expect(customerList.children.length).toEqual(3);
      const waltRegex = new RegExp(walt.name);
      screen.getByText(waltRegex).click();
      // should remove walt from add customer list
      expect(customerList.children.length).toEqual(2);
    });

    test("should dispatch update to firestore with default interval as attended interval on adding customer", () => {
      render(<AttendnaceCard {...baseProps} />);
      screen.getByTestId(__addCustomersButtonId__).click();
      const waltRegex = new RegExp(walt.name);
      screen.getByText(waltRegex).click();
      const mockAttAction = mockMarkAttImplementation({
        slotId,
        customerId: walt.id,
        attendedInterval: intervals[0],
      });
      expect(mockDispatch).toHaveBeenCalledWith(mockAttAction);
    });
  });
});
