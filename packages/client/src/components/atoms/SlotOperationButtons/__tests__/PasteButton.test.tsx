/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, afterEach } from "vitest";
import { screen, render, cleanup } from "@testing-library/react";
import { DateTime } from "luxon";

import { testId } from "@eisbuk/testing/testIds";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons from "../SlotOperationButtons";
import PasteButton from "../PasteButton";

import * as copyPasteActions from "@/store/actions/copyPaste";

import {
  __noDatePaste,
  __pasteButtonWrongContextError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

const mockDispatch = vi.fn();

vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe.skip("SlotOperationButtons", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe("'PasteButton' functionality test", () => {
    const slotsToCopy = {
      [ButtonContextType.Day]: true,
      [ButtonContextType.Week]: true,
    };

    const dummyDate = DateTime.fromISO("2021-03-01");

    test("if 'contextType=\"day\"' should paste all slots of the day in clipboard to new day", () => {
      // mock implementation of new paste slots day we'll be using to both
      // - create a test action object
      // - mock implementation within the component
      const mockPasteDayImplementation = (date: DateTime) =>
        ({ type: "paste_day", date } as any);
      // mock implementation of `newPasteSlotDay` within the component
      vi.spyOn(copyPasteActions, "pasteSlotsDay").mockImplementation(
        mockPasteDayImplementation
      );
      render(
        <SlotOperationButtons
          date={dummyDate}
          contextType={ButtonContextType.Day}
          slotsToCopy={slotsToCopy}
        >
          <PasteButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(testId("paste-button")).click();
      // test dispatch being called with the result of `newPasteSlotDay` mocked implementation
      expect(mockDispatch).toHaveBeenCalledWith(
        mockPasteDayImplementation(dummyDate)
      );
    });

    test("if 'contextType=\"week\"' should paste the week slots from clipboard to new week", () => {
      // mock implementation of new paste slots week we'll be using to both
      // - create a test action object
      // - mock implementation within the component
      const mockPasteWeekImplementation = (date: DateTime) =>
        ({ type: "paste_week", date } as any);
      // mock implementation of `newPasteSlotWeek` within the component
      vi.spyOn(copyPasteActions, "pasteSlotsWeek").mockImplementation(
        mockPasteWeekImplementation
      );
      render(
        <SlotOperationButtons
          date={dummyDate}
          contextType={ButtonContextType.Week}
          slotsToCopy={slotsToCopy}
        >
          <PasteButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(testId("paste-button")).click();
      // test dispatch being called with the result of `newPasteSlotWeek` mocked implementation
      expect(mockDispatch).toHaveBeenCalledWith(
        mockPasteWeekImplementation(dummyDate)
      );
    });

    test("should be disabled if no 'slotsToCopy' for given 'contextType'", () => {
      render(
        <SlotOperationButtons
          date={dummyDate}
          contextType={ButtonContextType.Week}
        >
          <PasteButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.getByTestId(testId("paste-button"));
      expect(buttonOnScreen).toHaveProperty("disabled", true);
    });
  });

  describe("'PasteButton' edge cases/error handling test", () => {
    const spyConsoleError = vi.spyOn(console, "error");

    test("should not render the button and should log error to console if not within 'SlotOperationButtons' context", () => {
      render(<PasteButton />);
      const buttonOnScreen = screen.queryByTestId(testId("paste-button"));
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__slotButtonNoContextError);
    });

    test("should not render the button and should log error to console if within 'contextType=\"slot\"'", () => {
      render(
        <SlotOperationButtons contextType={ButtonContextType.Slot}>
          <PasteButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(testId("paste-button"));
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(
        __pasteButtonWrongContextError
      );
    });

    test("should not render the button and should log error to console if within 'contextType=\"day\" | \"week\"' and no value for 'date' has been provided within the context", () => {
      render(
        <SlotOperationButtons contextType={ButtonContextType.Day}>
          <PasteButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(testId("paste-button"));
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__noDatePaste);
    });
  });
});
