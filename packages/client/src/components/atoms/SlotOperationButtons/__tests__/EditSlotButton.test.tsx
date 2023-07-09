/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, afterEach } from "vitest";
import { screen, render, cleanup } from "@testing-library/react";

import { testId } from "@eisbuk/testing/testIds";
import { baseSlot } from "@eisbuk/testing/slots";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons from "../SlotOperationButtons";
import EditSlotButton from "../EditSlotButton";

import {
  __editSlotButtonWrongContextError,
  __noSlotProvidedError,
  __slotButtonNoContextError,
} from "@/lib/errorMessages";

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("SlotOperationButtons", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe("'EditSlotButton' functionality test", () => {
    test("should open 'SlotFormDialog' on click (with current slot as 'slotToEdit')", () => {
      render(
        <SlotOperationButtons
          slot={baseSlot}
          contextType={ButtonContextType.Slot}
        >
          <EditSlotButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(testId("edit-slot-button")).click();
      const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
      expect(dispatchCallPayload.component).toEqual("SlotFormDialog");
      expect(dispatchCallPayload.props).toEqual({
        date: baseSlot.date,
        slotToEdit: baseSlot,
      });
    });
  });

  describe("'EditSlotButton' edge cases/error handling test", () => {
    const spyConsoleError = vi.spyOn(console, "error");

    test("should not render the button and should log error to console if not within 'SlotOperationButtons' context", () => {
      render(<EditSlotButton />);
      const buttonOnScreen = screen.queryByTestId(testId("edit-slot-button"));
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(__slotButtonNoContextError);
    });

    test("should not render the button and should log error to console if no value for 'slot' param has been provided within the context", () => {
      render(
        <SlotOperationButtons>
          <EditSlotButton />
        </SlotOperationButtons>
      );
      const buttonOnScreen = screen.queryByTestId(testId("edit-slot-button"));
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
      const buttonOnScreen = screen.queryByTestId(testId("edit-slot-button"));
      expect(buttonOnScreen).toEqual(null);
      expect(spyConsoleError).toHaveBeenCalledWith(
        __editSlotButtonWrongContextError
      );
    });
  });
});
