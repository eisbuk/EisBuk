/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup } from "@testing-library/react";
import { DateTime } from "luxon";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons from "../SlotOperationButtons";
import NewSlotButton from "../NewSlotButton";
import { openModal } from "@/features/modal/actions";

import {
  __newSlotButtonWrongContextError,
  __noDateProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { __newSlotButtonId__ } from "@/__testData__/testIds";

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

    test("should open 'SlotForm' on click", () => {
      render(
        <SlotOperationButtons
          date={dummyDate}
          contextType={ButtonContextType.Day}
        >
          <NewSlotButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(__newSlotButtonId__).click();
      expect(mockDispatch).toHaveBeenCalledWith(
        openModal({
          component: "SlotForm",
          props: { date: dummyDate.toISODate() },
        })
      );
    });
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
