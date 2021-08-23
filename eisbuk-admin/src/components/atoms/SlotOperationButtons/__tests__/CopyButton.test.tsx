/**
 * @jest-envirnoment jsdom-sixteen
 */
import React from "react";
import { screen, render, cleanup } from "@testing-library/react";
import { DateTime } from "luxon";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons from "../SlotOperationButtons";
import CopyButton from "../CopyButton";

import * as copyPasteActions from "@/store/actions/copyPaste";

import {
  __noDateCopy,
  __copyButtonWrongContextError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { __copyButtonId__ } from "../__testData__/testIds";

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

describe("Slot Opeartion Buttons", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("'CopyButton' functionality test", () => {
    // this is a dummy date of no significance for the tests
    // provided in order to render properly (as it's a requirement)
    const dummyDate = DateTime.fromISO("2021-03-01");

    test("if 'contextType = \"day\"' should add all slots of the day to clipboard on click", () => {
      // mock implementation of new copy slots day we'll be using to both
      // - create a test action object
      // - mock implementation within the component
      const mockCopyDayImplementation = (date: DateTime) =>
        ({ type: "copy_day", date } as any);
      // mock implementation of `newCopySlotDay` within the component
      jest
        .spyOn(copyPasteActions, "newCopySlotDay")
        .mockImplementation(mockCopyDayImplementation);
      render(
        <SlotOperationButtons
          date={dummyDate}
          contextType={ButtonContextType.Day}
        >
          <CopyButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(__copyButtonId__).click();
      // test dispatch being called with the result of `newCopySlotDay` mocked implementation
      expect(mockDispatch).toHaveBeenCalledWith(
        mockCopyDayImplementation(dummyDate)
      );
    });

    test("if 'contextType = \"week\"' should add all slots of the week to clipboard on click", () => {
      // mock implementation of new copy slots week we'll be using to both
      // - create a test action object
      // - mock implementation within the component
      const mockCopyWeekImplementation = (date: DateTime) =>
        ({ type: "copy_week", date } as any);
      // mock implementation of `newCopySlotWeek` within the component
      jest
        .spyOn(copyPasteActions, "newCopySlotWeek")
        .mockImplementation(mockCopyWeekImplementation);
      render(
        <SlotOperationButtons
          date={dummyDate}
          contextType={ButtonContextType.Week}
        >
          <CopyButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(__copyButtonId__).click();
      // test dispatch being called with the result of `newCopySlotWeek` mocked implementation
      expect(mockDispatch).toHaveBeenCalledWith(
        mockCopyWeekImplementation(dummyDate)
      );
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

    test("should not render the button and should log error to console if within 'contextType = \"slot\"'", () => {
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

    test("should not render the button and should log error to console if within 'contextType = \"day\" | \"week\"' and no value for 'date' has been provided in the context", () => {
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
