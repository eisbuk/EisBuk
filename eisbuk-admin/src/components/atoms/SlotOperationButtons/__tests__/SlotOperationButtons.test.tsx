/**
 * @jest-environment jsdom-sixteen
 */
import React, { useContext } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { DateTime } from "luxon";

import { Slot } from "eisbuk-shared";

import * as testIds from "../__testData__/testIds";

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

describe("Slot Opeartion Buttons", () => {
  afterEach(cleanup);

  describe("Smoke test", () => {
    test("should render without error with all buttons passed in", () => {
      render(
        <SlotOperationButtons
          contextType={ButtonContextType.Slot}
          date={dummyDate}
        >
          <NewSlotButton />
          <EditSlotButton />
          <CopyButton />
          <PasteButton />
          <DeleteButton />
        </SlotOperationButtons>
      );
      Object.values(testIds).forEach((testId) => {
        screen.getByTestId(testId);
      });
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

    test("should provide children with the context of 'type' provided as props", () => {
      render(
        <SlotOperationButtons contextType={ButtonContextType.Day}>
          <ContextTest />
        </SlotOperationButtons>
      );
      screen.getByText(`Type: ${ButtonContextType.Day}`);
    });

    test("should provide children with the context of 'slot' if provided as props", () => {
      const testSlot = {
        id: "test_slot_it",
      } as Slot<"id">;
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
