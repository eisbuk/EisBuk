/**
 * @jest-environment jsdom-sixteen
 */
import React from "react";
import { cleanup, screen, render } from "@testing-library/react";

import { DeprecatedSlot as Slot } from "eisbuk-shared/dist/types/deprecated/firestore";

import SlotCard from "../SlotCard";

import * as slotOperations from "@/store/actions/slotOperations";

import { __slotId__ } from "../__testData__/testIds";
import {
  __confirmDialogYesId__,
  __slotFormId__,
  __deleteButtonId__,
  __editSlotButtonId__,
} from "@/__testData__/testIds";
import { baseSlot } from "@/__testData__/dummyData";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
  /** We're mocking this not to fail tests including SlotForm (this will be returning newSlotTime as null) @TODO remove in the future */
  useSelector: () => null,
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ secretKey: "secret_key" }),
}));

/** @TODO remove this when the i18next is instantiated with tests */
jest.mock("i18next", () => ({
  ...jest.requireActual("i18next"),
  /** We're mocking this not to fail certain tests depending on this, but we're not testing the i18n values, so this is ok for now @TODO fix i18n in tests */
  t: () => "",
}));

describe("SlotCard", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  describe("Smoke test", () => {
    test("should render properly", () => {
      render(<SlotCard {...baseSlot} />);
    });

    test("should render intervals", () => {
      render(<SlotCard {...baseSlot} />);
      Object.keys(baseSlot.intervals).forEach((slotKey) => {
        screen.getByText(slotKey.split("-").join(" - "));
      });
    });
  });

  describe("SlotOperationButtons functionality", () => {
    beforeEach(() => {
      render(<SlotCard {...baseSlot} enableEdit />);
    });

    test("should open slot form on edit slot click", () => {
      screen.getByTestId(__editSlotButtonId__).click();
      screen.getByTestId(__slotFormId__);
    });

    test("should dispatch delete action on delete confirmation click", () => {
      // mock implementation of `deleteSlot` used to mock implementation in component and for testing
      const mockDelSlotImplementation = (slotId: Slot<"id">["id"]) => ({
        type: "delete_slot",
        slotId,
      });
      // mock deleteSlot function
      jest
        .spyOn(slotOperations, "deleteSlot")
        .mockImplementation(mockDelSlotImplementation);
      // open delete dialog
      screen.getByTestId(__deleteButtonId__).click();
      // confirm delete dialog
      screen.getByTestId(__confirmDialogYesId__).click();
      const mockDeleteAction = mockDelSlotImplementation(baseSlot.id);
      expect(mockDispatch).toHaveBeenCalledWith(mockDeleteAction);
    });
  });

  describe("Test clicking on slot card", () => {
    const mockOnClick = jest.fn();

    test("should fire 'onClick' function if provided", () => {
      render(<SlotCard {...baseSlot} enableEdit onClick={mockOnClick} />);
      screen.getByTestId(__slotId__).click();
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test("should not explode on click if no 'onClick' handler has been provided", () => {
      render(<SlotCard {...baseSlot} enableEdit />);
      screen.getByTestId(__slotId__).click();
    });
  });
});
