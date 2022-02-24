/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  screen,
  render,
  waitForElementToBeRemoved,
  cleanup,
  fireEvent,
} from "@testing-library/react";

import { Customer, SlotInterface } from "eisbuk-shared";

import "@/__testSetup__/firestoreSetup";

import AttendnaceCard from "../AttendanceCard";

import * as attendanceOperations from "@/store/actions/attendanceOperations";

import { testWithMutationObserver } from "@/__testUtils__/envUtils";

import {
  baseAttendanceCard,
  intervalStrings as intervals,
} from "@/__testData__/attendance";
import { saul, walt } from "@/__testData__/customers";
import {
  __addCustomersButtonId__,
  __closeCustomersListId__,
} from "../__testData__/testIds";
import { __customersListId__ } from "@/__testData__/testIds";

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
const { id: slotId } = baseAttendanceCard;

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
        render(<AttendnaceCard {...baseAttendanceCard} />);
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

    testWithMutationObserver(
      "should close customers list on esc button press",
      async () => {
        render(<AttendnaceCard {...baseAttendanceCard} />);
        const customerList = screen.queryByTestId(__customersListId__);
        expect(customerList).toBeNull();
        screen.getByTestId(__addCustomersButtonId__).click();
        screen.getByTestId(__customersListId__);
        fireEvent.keyDown(screen.getByTestId(__customersListId__), {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          charCode: 27,
        });
        await waitForElementToBeRemoved(() =>
          screen.getByTestId(__customersListId__)
        );
      }
    );

    testWithMutationObserver(
      "should close customer list on clicking outside modal",
      async () => {
        render(<AttendnaceCard {...baseAttendanceCard} />);
        const customerList = screen.queryByTestId(__customersListId__);
        expect(customerList).toBeNull();
        screen.getByTestId(__addCustomersButtonId__).click();
        screen.getByTestId(__customersListId__);
        const dialogContainer = screen.getByRole("presentation");
        fireEvent.click(dialogContainer.children[0]);

        await waitForElementToBeRemoved(() =>
          screen.getByTestId(__customersListId__)
        );
      }
    );

    testWithMutationObserver(
      "should close when there are no more customers to show",
      async () => {
        const { rerender } = render(<AttendnaceCard {...baseAttendanceCard} />);
        screen.getByTestId(__addCustomersButtonId__).click();
        // we're rerendering the component without the customers to test this behavior
        // as customer update will come from outside the component
        rerender(
          <AttendnaceCard
            {...{ ...baseAttendanceCard, allCustomers: [], customers: [] }}
          />
        );
        // the modal should close
        await waitForElementToBeRemoved(() =>
          screen.getByTestId(__customersListId__)
        );
      }
    );

    test("should render all customers for slot's category who haven't booked already (when open)", () => {
      const waltRegex = new RegExp(walt.name);
      render(
        <AttendnaceCard
          {...baseAttendanceCard}
          customers={[saulWithAttendance]}
        />
      );
      // make sure that walt isn't displayed before opening of the modal
      expect(screen.queryByText(waltRegex)).toBeNull();
      screen.getByTestId(__addCustomersButtonId__).click();
      // should render walt -> category: "course", not within attended customers
      screen.getByText(waltRegex);
      const customerList = screen.getByTestId(__customersListId__);
      // should have only two children (`walt` and `jian`) as `saul` has already been marked as attended, and `gus` doesn't belong to the category
      expect(customerList.children.length).toEqual(2);
    });

    test("should not render deleted customers", () => {
      const waltRegex = new RegExp(walt.name);
      render(
        <AttendnaceCard
          {...baseAttendanceCard}
          customers={[saulWithAttendance]}
          allCustomers={[saul, { ...walt, deleted: true }]}
        />
      );
      screen.getByTestId(__addCustomersButtonId__).click();
      expect(screen.queryByText(waltRegex)).toBeNull();
    });

    test("should dispatch update to firestore with default interval as attended interval on adding customer", () => {
      render(<AttendnaceCard {...baseAttendanceCard} />);
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
