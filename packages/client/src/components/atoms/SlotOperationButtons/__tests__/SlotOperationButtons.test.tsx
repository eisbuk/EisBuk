/**
 * @vitest-environment jsdom
 */

import React, { useContext } from "react";
import { describe, vi, test, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DateTime } from "luxon";

import { SlotInterface, luxon2ISODate } from "@eisbuk/shared";

import { testId } from "@eisbuk/testing/testIds";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons, {
  ButtonGroupContext,
} from "../SlotOperationButtons";
import NewSlotButton from "../NewSlotButton";
import EditSlotButton from "../EditSlotButton";
import CopyButton from "../CopyButton";
import PasteButton from "../PasteButton";
import DeleteButton from "../DeleteButton";

import { baseSlot } from "@eisbuk/testing/slots";

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
      screen.getByTestId(testId("edit-slot-button"));
      screen.getByTestId(testId("delete-button"));
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
      screen.getByTestId(testId("new-slot-button"));
      screen.getByTestId(testId("copy-day-button", { date: dummyDate }));
      screen.getByTestId(testId("paste-button"));
      screen.getByTestId(testId("delete-button"));
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
      screen.getByTestId(testId("copy-week-button"));
      screen.getByTestId(testId("paste-button"));
      screen.getByTestId(testId("delete-button"));
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
