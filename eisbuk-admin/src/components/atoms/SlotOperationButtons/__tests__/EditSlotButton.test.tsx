/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  screen,
  render,
  waitForElementToBeRemoved,
  cleanup,
} from "@testing-library/react";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons from "../SlotOperationButtons";
import EditSlotButton from "../EditSlotButton";

import {
  __editSlotButtonWrongContextError,
  __noSlotProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

import { testWithMutationObserver } from "@/__testUtils__/envUtils";

import {
  __editSlotButtonId__,
  __slotFormId__,
  __cancelFormId__,
} from "@/__testData__/testIds";
import { baseSlot } from "@/__testData__/slots";

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
}));

describe("SlotOperationButtons", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("'EditSlotButton' functionality test", () => {
    const notes = "note-used-to-test-form-has-been-opened-with-passed-slot";
    beforeEach(() => {
      render(
        <SlotOperationButtons
          slot={{ ...baseSlot, notes }}
          contextType={ButtonContextType.Slot}
        >
          <EditSlotButton />
        </SlotOperationButtons>
      );
    });

    test("should open 'SlotForm' on click (with current slot as 'slotToEdit')", () => {
      const formOnScreen = screen.queryByTestId(__slotFormId__);
      // should not appear on screen at first
      expect(formOnScreen).toEqual(null);
      screen.getByTestId(__editSlotButtonId__).click();
      // check if form opened
      screen.getByTestId(__slotFormId__);
      // check if slot passed for edit
      screen.getByText(new RegExp(notes));
    });

    testWithMutationObserver(
      "should close 'SlotForm' on forms 'onClose' trigger",
      async () => {
        // open form
        screen.getByTestId(__editSlotButtonId__).click();
        // should close form
        screen.getByTestId(__cancelFormId__).click();
        await waitForElementToBeRemoved(() =>
          screen.queryByTestId(__slotFormId__)
        );
      }
    );
  });

  describe("'EditSlotButton' edge cases/error handling test", () => {
    const spyConsoleError = jest.spyOn(console, "error");

    test("should not render the button and should log error to console if not within 'SlotOperationButtons' context", () => {
      render(<EditSlotButton />);
      const buttonOnScreen = screen.queryByTestId(__editSlotButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__slotButtonNoContextError);
    });

    test("should not render the button and should log error to console if no value for 'slot' param has been provided within the context", () => {
      render(
        <SlotOperationButtons>
          <EditSlotButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(__editSlotButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__noSlotProvidedError);
    });

    test("should not render the button and should log error to console if trying to render under any 'contextType' other than \"slot\"", () => {
      render(
        <SlotOperationButtons
          contextType={ButtonContextType.Week}
          slot={baseSlot}
        >
          <EditSlotButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(__editSlotButtonId__);
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(
        __editSlotButtonWrongContextError
      );
    });
  });
});
