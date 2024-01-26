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
import NewSlotButton from "../NewSlotButton";

import {
  __newSlotButtonWrongContextError,
  __noDateProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

const mockDispatch = vi.fn();

vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: () => ({}),
}));

describe("SlotOperationButtons", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe("'NewSlotButton' functionality test", () => {
    // this is a dummy date of no significance for the tests
    // provided in order to render properly (as it's a requirement)
    const dummyDate = DateTime.fromISO("2021-03-01");

    test("should open 'SlotFormDialog' on click", () => {
      render(
        <SlotOperationButtons
          date={dummyDate}
          contextType={ButtonContextType.Day}
        >
          <NewSlotButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(testId("new-slot-button")).click();
      const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
      expect(dispatchCallPayload.component).toEqual("SlotFormDialog");
      expect(dispatchCallPayload.props).toEqual({
        date: dummyDate.toISODate(),
      });
    });
  });

  describe("'NewSlotButton' edge cases/error handling test", () => {
    const spyConsoleError = vi.spyOn(console, "error");

    test("should not render the button and should log error to console if not within 'SlotOperationButtons' context", () => {
      render(<NewSlotButton />);
      const buttonOnScreen = screen.queryByTestId(testId("new-slot-button"));
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__slotButtonNoContextError);
    });

    test('should not render the button and should log error to console if trying to render within any context other than "day"', () => {
      render(
        <SlotOperationButtons contextType={ButtonContextType.Slot}>
          <NewSlotButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(testId("new-slot-button"));
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(
        __newSlotButtonWrongContextError
      );
    });

    test("should not render the button and should log error to console if no value for 'date' param has been provided within the context", () => {
      render(
        <SlotOperationButtons contextType={ButtonContextType.Day}>
          <NewSlotButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(testId("new-slot-button"));
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__noDateProvidedError);
    });
  });
});
