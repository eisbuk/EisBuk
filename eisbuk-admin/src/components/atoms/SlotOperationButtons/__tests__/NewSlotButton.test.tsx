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

import SlotOperationButtons from "../SlotOperationButtons";
import NewSlotButton from "../NewSlotButton";

import {
  __newSlotButtonWrongContextError,
  __noDateProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { ButtonContextType } from "@/enums/components";

import { testWithMutationObserver } from "@/__testUtils__/envUtils";

import {
  __newSlotButtonId__,
  __slotFormId__,
  __cancelFormId__,
} from "@/__testData__/testIds";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("SlotOperationButtons", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("'NewSlotButton' functionality test", () => {
    // this is a dummy date of no significance for the tests
    // provided in order to render properly (as it's a requirement)
    const dummyDate = DateTime.fromISO("2021-03-01");

    beforeEach(() => {
      render(
        <SlotOperationButtons
          date={dummyDate}
          contextType={ButtonContextType.Day}
        >
          <NewSlotButton />
        </SlotOperationButtons>
      );
    });

    test("should open 'SlotForm' on click", () => {
      const formOnScreen = screen.queryByTestId(__slotFormId__);
      // should not appear on screen at first
      expect(formOnScreen).toEqual(null);
      screen.getByTestId(__newSlotButtonId__).click();
      screen.getByTestId(__slotFormId__);
    });

    testWithMutationObserver(
      "should close 'SlotForm' on forms 'onClose' trigger",
      async () => {
        // open form
        screen.getByTestId(__newSlotButtonId__).click();
        // should close form
        screen.getByTestId(__cancelFormId__).click();
        await waitForElementToBeRemoved(() =>
          screen.queryByTestId(__slotFormId__)
        );
      }
    );
  });

  describe("'NewSlotButton' edge cases/error handling test", () => {
    const spyConsoleError = jest.spyOn(console, "error");

    test("should not render the button and should log error to console if not within 'SlotOperationButtons' context", () => {
      render(<NewSlotButton />);
      const buttonOnScreen = screen.queryByTestId(__newSlotButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__slotButtonNoContextError);
    });

    test('should not render the button and should log error to console if trying to render within any context other than "day"', () => {
      render(
        <SlotOperationButtons contextType={ButtonContextType.Slot}>
          <NewSlotButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(__newSlotButtonId__);
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
      const buttonOnScreen = screen.queryByTestId(__newSlotButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__noDateProvidedError);
    });
  });
});
