/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, beforeEach } from "vitest";
import { screen, render, cleanup } from "@testing-library/react";
import { DateTime } from "luxon";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons from "../SlotOperationButtons";
import DeleteButton from "../DeleteButton";

import * as slotOperations from "@/store/actions/slotOperations";

import {
  __noDateDelete,
  __noSlotToDelete,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { __deleteButtonId__ } from "@eisbuk/shared";
import { baseSlot } from "@eisbuk/test-data/slots";

const mockDispatch = vi.fn();

vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

// #region mockDeleteActions
/**
 * Mock implementation of `deleteSlotsDay` we'll be using to both mock function within component
 * as well as for tests.
 * @param date of day of slots to delete (just like in the original function)
 * @returns function should return a thunk, but we're returning a dummy object with values passed in for easier testing
 */
const mockDelDayImplementation = (date: DateTime) => ({
  type: "delete_slot_day",
  date,
});
vi.spyOn(slotOperations, "deleteSlotsDay").mockImplementation(
  mockDelDayImplementation as any
);

/**
 * Mock implementation of `deleteSlotsWeek` we'll be using to both mock function within component
 * as well as for tests.
 * @param date of first day of the week to delete (just like in the original function)
 * @returns function should return a thunk, but we're returning a dummy object with values passed in for easier testing
 */
const mockDelWeekImplementation = (date: DateTime) => ({
  type: "delete_slot_week",
  date,
});
vi.spyOn(slotOperations, "deleteSlotsWeek").mockImplementation(
  mockDelWeekImplementation as any
);
// #endregion mockDeleteActions

// a dummy date we're using to test deleting of slots day and slots week
const testDate = DateTime.fromISO("2021-03-01");

describe("SlotOperationButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe("DeleteButton", () => {
    test("should open 'DeleteSlotDialog' modal onClick if within \"slot\" context", () => {
      render(
        <SlotOperationButtons
          contextType={ButtonContextType.Slot}
          slot={baseSlot}
        >
          <DeleteButton />
        </SlotOperationButtons>
      );
      // initiate delete
      screen.getByTestId(__deleteButtonId__).click();
      const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
      expect(dispatchCallPayload.component).toEqual("DeleteSlotDialog");
      expect(dispatchCallPayload.props).toEqual(baseSlot);
    });

    test("should show 'DeleteSlotDisabledDialog' modal onClick if within \"slot\" context and delete disabled", () => {
      render(
        <SlotOperationButtons
          contextType={ButtonContextType.Slot}
          slot={baseSlot}
          disableDelete
        >
          <DeleteButton />
        </SlotOperationButtons>
      );
      // initiate delete
      screen.getByTestId(__deleteButtonId__).click();
      const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
      expect(dispatchCallPayload.component).toEqual("DeleteSlotDisabledDialog");
      expect(dispatchCallPayload.props).toEqual(baseSlot);
    });

    test("should dispatch 'deleteSlotsDay' onClick if within \"day\" context", () => {
      render(
        <SlotOperationButtons
          contextType={ButtonContextType.Day}
          date={testDate}
        >
          <DeleteButton />
        </SlotOperationButtons>
      );
      // initiate delete
      screen.getByTestId(__deleteButtonId__).click();
      // create a dummy delete slots week action object with proper values
      const mockDayDelAction = mockDelDayImplementation(testDate);
      // test (using mocking tactics explained above) if `deleteSlotsDay`
      // has been dispatched to the store with proper date
      expect(mockDispatch).toHaveBeenCalledWith(mockDayDelAction);
    });

    test("should dispatch 'deleteSlotsWeek' onClick if within \"week\" context", () => {
      render(
        <SlotOperationButtons
          contextType={ButtonContextType.Week}
          date={testDate}
        >
          <DeleteButton />
        </SlotOperationButtons>
      );
      // initiate delete
      screen.getByTestId(__deleteButtonId__).click();
      // create a dummy delete slot action object with proper values
      const mockWeekDelAction = mockDelWeekImplementation(testDate);
      // test (using mocking tactics explained above) if `deleteSlotsWeek`
      // has been dispatched to the store with proper date
      expect(mockDispatch).toHaveBeenCalledWith(mockWeekDelAction);
    });
  });

  describe("'DeleteButton' edge cases/error handling test", () => {
    const spyConsoleError = vi.spyOn(console, "error");

    test("should not render the button and should log error to console if not within 'SlotOperationButtons' context", () => {
      render(<DeleteButton />);
      const buttonOnScreen = screen.queryByTestId(__deleteButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__slotButtonNoContextError);
    });

    test("should not render the button and should log error to console if within 'contextType=\"slot\"' and no value for 'slot' has been provided within the context", () => {
      render(
        <SlotOperationButtons contextType={ButtonContextType.Slot}>
          <DeleteButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(__deleteButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__noSlotToDelete);
    });

    test("should not render the button and should log error to console if within 'contextType=\"day\" | \"week\"' and no value for 'date' has been provided within the context", () => {
      render(
        <SlotOperationButtons contextType={ButtonContextType.Day}>
          <DeleteButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(__deleteButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__noDateDelete);
    });
  });
});
