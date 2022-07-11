/**
 * @jest-environment jsdom
 */

import React from "react";
import { cleanup, screen, render } from "@testing-library/react";

import SlotCard from "../SlotCard";

import { __slotId__ } from "../__testData__/testIds";
import {
  __slotFormId__,
  __deleteButtonId__,
  __editSlotButtonId__,
} from "@/__testData__/testIds";
import { baseSlot } from "@/__testData__/slots";
import { openModal } from "@/features/modal/actions";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ secretKey: "secret_key" }),
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
      Object.keys(baseSlot.intervals).forEach((intervalKey) => {
        // we're using `getAllByText` because the longest test interval is in fact start-finish
        // so it appears as both interval and slot time span (title)
        screen.getAllByText(intervalKey.split("-").join(" - "));
      });
    });

    test("should render startTime-endTime string", () => {
      // explicitly set intervals for straightforward testing
      const intervals = {
        ["09:00-10:00"]: {
          startTime: "09:00",
          endTime: "10:00",
        },
        ["15:00-18:00"]: {
          startTime: "15:00",
          endTime: "18:00",
        },
      };
      render(<SlotCard {...{ ...baseSlot, intervals }} />);
      screen.getByText("09:00 - 18:00");
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

    test("should initiate delete-slot flow on delete button click", () => {
      screen.getByTestId(__deleteButtonId__).click();
      expect(mockDispatch).toHaveBeenCalledWith(
        openModal({ component: "DeleteSlotDialog", props: baseSlot })
      );
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
