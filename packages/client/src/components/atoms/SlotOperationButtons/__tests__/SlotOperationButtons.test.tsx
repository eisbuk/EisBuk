/**
 * @vitest-environment jsdom
 */

import React, { useContext } from "react";
import { describe, vi, test, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DateTime } from "luxon";

import {
  SlotInterface,
  luxon2ISODate,
  __copyDayButtonId__,
  __copyWeekButtonId__,
  __editSlotButtonId__,
  __deleteButtonId__,
  __newSlotButtonId__,
  __pasteButtonId__,
} from "@eisbuk/shared";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons, {
  ButtonGroupContext,
} from "../SlotOperationButtons";
import NewSlotButton from "../NewSlotButton";
import EditSlotButton from "../EditSlotButton";
import CopyButton from "../CopyButton";
import PasteButton from "../PasteButton";
import DeleteButton from "../DeleteButton";

import { baseSlot } from "@eisbuk/test-data/slots";

vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: () => vi.fn(),
}));

const dummyDate = DateTime.fromISO("2021-03-01");

describe("SlotOperationButtons", () => {
  afterEach(cleanup);

  describe("Smoke test", () => {
    test("should render whitelisted buttons 'contextType=\"slot\"' without error with all appropriate buttons passed in", () => {
      render(
        <SlotOperationButtons
          contextType={ButtonContextType.Slot}
          date={dummyDate}
          slot={baseSlot}
        >
          <EditSlotButton />
          <DeleteButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(__editSlotButtonId__);
      screen.getByTestId(__deleteButtonId__);
    });
    test("should render whitelisted buttons 'contextType=\"day\"' without error with all appropriate buttons passed in", () => {
      render(
        <SlotOperationButtons
          contextType={ButtonContextType.Day}
          date={dummyDate}
        >
          <NewSlotButton />
          <CopyButton />
          <PasteButton />
          <DeleteButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(__newSlotButtonId__);
      screen.getByTestId(`${__copyDayButtonId__}${dummyDate}`);
      screen.getByTestId(__pasteButtonId__);
      screen.getByTestId(__deleteButtonId__);
    });

    test("should render whitelisted buttons 'contextType=\"week\"' without error with all appropriate buttons passed in", () => {
      render(
        <SlotOperationButtons
          contextType={ButtonContextType.Week}
          date={dummyDate}
        >
          <CopyButton />
          <PasteButton />
          <DeleteButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(__copyWeekButtonId__);
      screen.getByTestId(__pasteButtonId__);
      screen.getByTestId(__deleteButtonId__);
    });
  });

  describe("Test context functionality", () => {
    // a small util component we'll be using to test context
    const ContextTest: React.FC = () => {
      const context = useContext(ButtonGroupContext);
      return (
        <>
          <p>Type: {context?.contextType}</p>
          <p>SlotId: {context?.slot?.id}</p>
          <p>Date: {context?.date ? luxon2ISODate(context.date) : null}</p>
        </>
      );
    };

    test("should provide children with the 'contextType' provided as props", () => {
      render(
        <SlotOperationButtons contextType={ButtonContextType.Day}>
          <ContextTest />
        </SlotOperationButtons>
      );
      screen.getByText(`Type: ${ButtonContextType.Day}`);
    });

    test("should provide children with the context of 'slot' if provided as props", () => {
      const testSlot = {
        id: "test_slot_id",
      } as SlotInterface;
      render(
        <SlotOperationButtons slot={testSlot}>
          <ContextTest />
        </SlotOperationButtons>
      );
      screen.getByText(`SlotId: ${testSlot.id}`);
    });

    test("should provide children with the context of 'date' provided as props", () => {
      const testDateISO = "2021-03-01";
      const testDate = DateTime.fromISO(testDateISO);
      render(
        <SlotOperationButtons date={testDate}>
          <ContextTest />
        </SlotOperationButtons>
      );
      screen.getByText(`Date: ${testDateISO}`);
    });
  });
});
