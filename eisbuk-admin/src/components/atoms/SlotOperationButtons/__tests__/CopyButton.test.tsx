/**
 * @jest-envirnoment jsdom-sixteen
 */
import React from "react";
import { screen, render, cleanup } from "@testing-library/react";
import { DateTime } from "luxon";

import {
  __noDateCopy,
  __copyButtonWrongContextError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons from "../SlotOperationButtons";
import CopyButton from "../CopyButton";

import * as copyPasteActions from "@/store/actions/copyPaste";

import { __copyButtonId__ } from "@/__testData__/testIds";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("SlotOperationButtons", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("'CopyButton' functionality test", () => {
    // a dummy date we're using to test dispatching copy actions for slots day and slots week
    const testDate = DateTime.fromISO("2021-03-01");

    test("if 'contextType=\"day\"' should add all slots of the day to clipboard on click", () => {
      // mock implementation of `newCopySlotsDay` function we'll be using to both
      // - create a test action object
      // - mock implementation within the component
      const mockCopyDayImplementation = (date: DateTime) =>
        ({ type: "copy_day", date } as any);
      jest
        .spyOn(copyPasteActions, "copySlotsDay")
        .mockImplementation(mockCopyDayImplementation);
      render(
        <SlotOperationButtons
          date={testDate}
          contextType={ButtonContextType.Day}
        >
          <CopyButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(__copyButtonId__).click();
      // test dispatch being called with the result of `newCopySlotDay` mocked implementation
      expect(mockDispatch).toHaveBeenCalledWith(
        mockCopyDayImplementation(testDate)
      );
    });

    test("if 'contextType=\"week\"' should add all slots of the week to clipboard on click", () => {
      // mock implementation of `newCopySlotsWeek` function we'll be using to both
      // - create a test action object
      // - mock implementation within the component
      const mockCopyWeekImplementation = () => ({ type: "copy_week" } as any);
      // mock implementation of `newCopySlotWeek` within the component
      jest
        .spyOn(copyPasteActions, "copySlotsWeek")
        .mockImplementation(mockCopyWeekImplementation);
      render(
        <SlotOperationButtons
          date={testDate}
          contextType={ButtonContextType.Week}
        >
          <CopyButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(__copyButtonId__).click();
      // test dispatch being called with the result of `newCopySlotWeek` mocked implementation
      expect(mockDispatch).toHaveBeenCalledWith(mockCopyWeekImplementation());
    });
  });

  describe("'CopyButton' edge cases/error handling test", () => {
    const spyConsoleError = jest.spyOn(console, "error");

    test("should not render the button and should log error to console if not under 'SlotOperationButtons' context", () => {
      render(<CopyButton />);
      const buttonOnScreen = screen.queryByTestId(__copyButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__slotButtonNoContextError);
    });

    test("should not render the button and should log error to console if within 'contextType=\"slot\"'", () => {
      render(
        <SlotOperationButtons contextType={ButtonContextType.Slot}>
          <CopyButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(__copyButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(
        __copyButtonWrongContextError
      );
    });

    test("should not render the button and should log error to console if within 'contextType=\"day\" | \"week\"' and no value for 'date' has been provided within the context", () => {
      render(
        <SlotOperationButtons contextType={ButtonContextType.Day}>
          <CopyButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(__copyButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__noDateCopy);
    });
  });
});
