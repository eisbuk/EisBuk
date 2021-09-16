/**
 * @jest-environment jsdom-sixteen
 */
import React, { useContext } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { DateTime } from "luxon";

import { SlotInterface } from "eisbuk-shared";

import * as testIds from "@/__testData__/testIds";

import { ButtonContextType } from "@/enums/components";

import SlotOperationButtons, {
  ButtonGroupContext,
} from "../SlotOperationButtons";
import NewSlotButton from "../NewSlotButton";
import EditSlotButton from "../EditSlotButton";
import CopyButton from "../CopyButton";
import PasteButton from "../PasteButton";
import DeleteButton from "../DeleteButton";

import { luxon2ISODate } from "@/utils/date";
import { dummySlot } from "@/__testData__/dummyData";

jest.mock("react-redux", () => ({
  /** @TODO Remove this when we update slot form to be more atomic  */
  useSelector: () => "",
  useDispatch: () => jest.fn(),
}));

/** @TODO remove this when the i18next is instantiated with tests */
jest.mock("i18next", () => ({
  /** We're mocking this not to fail certain tests depending on this, but we're not testing the i18n values, so this is ok for now @TODO fix i18n in tests */
  t: () => "",
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
          slot={dummySlot}
        >
          <EditSlotButton />
          <DeleteButton />
        </SlotOperationButtons>
      );
      screen.getByTestId(testIds.__editSlotButtonId__);
      screen.getByTestId(testIds.__deleteButtonId__);
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
      screen.getByTestId(testIds.__newSlotButtonId__);
      screen.getByTestId(testIds.__copyButtonId__);
      screen.getByTestId(testIds.__pasteButtonId__);
      screen.getByTestId(testIds.__deleteButtonId__);
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
      screen.getByTestId(testIds.__copyButtonId__);
      screen.getByTestId(testIds.__pasteButtonId__);
      screen.getByTestId(testIds.__deleteButtonId__);
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
