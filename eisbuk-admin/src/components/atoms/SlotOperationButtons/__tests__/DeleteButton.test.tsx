/**
 * @jest-envirnoment jsdom-sixteen
 */
import React from "react";
import {
  screen,
  render,
  waitForElementToBeRemoved,
  cleanup,
} from "@testing-library/react";
import { DateTime } from "luxon";

import { ButtonContextType } from "@/enums/components";

import { Slot } from "eisbuk-shared";

import SlotOperationButtons from "../SlotOperationButtons";
import DeleteButton from "../DeleteButton";

import * as slotOperations from "@/store/actions/slotOperations";

import {
  __noDateDelete,
  __noSlotToDelete,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { testWithMutationObserver } from "@/__testUtils__/envUtils";

import { __deleteButtonId__ } from "../__testData__/testIds";
import {
  __confirmDialogNoId__,
  __confirmDialogYesId__,
} from "@/__testData__/testIds";
import { dummySlot } from "@/__testData__/dummyData";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  /** @TODO Remove this when we update SlotForm to be more atomic  */
  useSelector: () => "",
  useDispatch: () => mockDispatch,
}));

/** @TODO remove this when the i18next is instantiated with tests */
jest.mock("i18next", () => ({
  /** We're mocking this not to fail certain tests depending on this, but we're not testing the i18n values, so this is ok for now @TODO fix i18n in tests */
  t: () => "",
}));

// #region mockDeleteActions
/**
 * Mock implementation of `deleteSlot` function we'll be using to both mock function within component
 * as well as for tests.
 * @param slotId of slot to delete (just like in the original function)
 * @returns function should return a thunk, but we're returning a dummy object with values passed in for easier testing
 */
const mockDelSlotImplementation = (slotId: Slot<"id">["id"]) => ({
  type: "delete_slot",
  slotId,
});
jest
  .spyOn(slotOperations, "deleteSlot")
  .mockImplementation(mockDelSlotImplementation as any);

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
jest
  .spyOn(slotOperations, "deleteSlotsDay")
  .mockImplementation(mockDelDayImplementation as any);

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
jest
  .spyOn(slotOperations, "deleteSlotsWeek")
  .mockImplementation(mockDelWeekImplementation as any);
// #endregion mockDeleteActions

// a dummy date we're using to test deleting of slots day and slots week
const testDate = DateTime.fromISO("2021-03-01");

describe("SlotOperationButtons", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("Test straightforward delete dispatching (withouth the dialog)", () => {
    test("should dispatch 'deleteSlot' onClick if within \"slot\" context and no prop for dialog has been provided", () => {
      render(
        <SlotOperationButtons
          contextType={ButtonContextType.Slot}
          slot={dummySlot}
        >
          <DeleteButton />
        </SlotOperationButtons>
      );
      // initiate delete
      screen.getByTestId(__deleteButtonId__).click();
      // create a dummy delete slots day action object with proper values
      const mockSlotDelAction = mockDelSlotImplementation(dummySlot.id);
      // test (using mocking tactics explained above) if `deleteSlot`
      // has been dispatched to the store with proper slot data
      expect(mockDispatch).toHaveBeenCalledWith(mockSlotDelAction);
    });

    test("should dispatch 'deleteSlotsDay' onClick if within \"day\" context and no prop for dialog has been provided", () => {
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

    test("should dispatch 'deleteSlotsWeek' onClick if within \"week\" context and no prop for dialog has been provided", () => {
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

  describe("Test delete action dispatching with added dialog confirmation step", () => {
    // props for dialog we'll use to test rendering the dialog first (before dispatching any delete actions)
    const testDialog = {
      title: "Test dialog",
      description: "This is a test description of confirmation dialog",
    };

    beforeEach(() => {
      // we'll be rendering the simplest setup: `contextType="week"` (default)
      // there's no need to test for each `contextType` but rather focus only on additional confirmation step
      render(
        <SlotOperationButtons
          contextType={ButtonContextType.Week}
          date={testDate}
        >
          <DeleteButton confirmDialog={testDialog} />
        </SlotOperationButtons>
      );
    });

    test("if 'dialog' prop provided, should open a confirm dialog on click (without dispatching the delete function)", () => {
      screen.getByTestId(__deleteButtonId__).click();
      // check that no delete function has been called yet
      expect(mockDispatch).not.toHaveBeenCalled();
      // check that the dialog has been properly rendered
      screen.getByText(testDialog.title);
      screen.getByText(testDialog.description);
    });

    test("should dispatch delete function after confirming the dialog (if 'dialog' prop are provided)", () => {
      screen.getByTestId(__deleteButtonId__).click();
      screen.getByTestId(__confirmDialogYesId__).click();
      // create a dummy delete slot action object with proper values
      const mockWeekDelAction = mockDelWeekImplementation(testDate);
      // test (using mocking tactics explained above) if `deleteSlotsWeek`
      // has been dispatched to the store with proper date
      expect(mockDispatch).toHaveBeenCalledWith(mockWeekDelAction);
    });

    testWithMutationObserver(
      'should close the dialog on negative confirmation ("No")',
      async () => {
        screen.getByTestId(__deleteButtonId__).click();
        screen.getByTestId(__confirmDialogNoId__).click();
        await waitForElementToBeRemoved(() =>
          screen.getByText(testDialog.title)
        );
      }
    );
  });

  describe("'DeleteButton' edge cases/error handling test", () => {
    const spyConsoleError = jest.spyOn(console, "error");

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
