/**
 * @jest-environment jsdom-sixteen
 */
import React from "react";
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { DateTime } from "luxon";

import { SlotButton } from "@/enums/components";

import SlotOperationButtons from "../SlotOperationButtons";

import { __slotButtonId__ } from "../__testData__/testIds";

import { __cancelFormId__, __slotFormId__ } from "@/__testData__/testIds";

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  /** @TODO Remove this when we update slot form to be more atomic  */
  useSelector: () => "",
}));

/** @TODO remove this when the i18next is instantiated with tests */
jest.mock("i18next", () => ({
  ...jest.requireActual("i18next"),
  /** We're mocking this not to fail certain tests depending on this, but we're not testing the i18n values, so this is ok for now @TODO fix i18n in tests */
  t: () => "",
}));

describe("Slot Opeartion Buttons", () => {
  describe("Smoke test", () => {
    test("should render, without error, with all of the buttons passed in", () => {
      const allButtons = Object.values(SlotButton);
      const buttons = allButtons.map((component) => ({
        component,
      }));
      render(<SlotOperationButtons {...{ buttons }} />);
      const buttonsOnScreen = screen.queryAllByTestId(__slotButtonId__).length;
      expect(buttonsOnScreen).toEqual(allButtons.length);
    });
  });

  describe("Test button functionality", () => {
    test("should fire passed 'onClick' function on click", () => {
      const mockClick = jest.fn();
      const buttons = [
        {
          component: SlotButton.Copy,
          onClick: mockClick,
        },
      ];
      render(<SlotOperationButtons {...{ buttons }} />);
      screen.getByTestId(__slotButtonId__).click();
      expect(mockClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Test new slot button", () => {
    const mockClick = jest.fn();
    const buttons = [
      {
        component: SlotButton.New,
        onClick: mockClick,
      },
    ];

    beforeEach(() => {
      render(<SlotOperationButtons {...{ buttons }} />);
    });

    test("should ignore 'onClick' function as it has internal 'onClick' functionality", () => {
      expect(mockClick).not.toHaveBeenCalled();
    });

    test("should open createSlot form on click", () => {
      const formOnScreen = screen.queryByTestId(__slotFormId__);
      // should not appear on screen at first
      expect(formOnScreen).toEqual(null);
      screen.getByTestId(__slotButtonId__).click();
      screen.getByTestId(__slotFormId__);
    });

    // test("should close createSlot form on forms 'onClose' trigger", async () => {
    //   // open form
    //   screen.getByTestId(__slotButtonId__).click();
    //   // should close form
    //   screen.getByTestId(__cancelFormId__).click();
    //   await waitForElementToBeRemoved(() =>
    //     screen.queryByTestId(__slotFormId__)
    //   );
    // });
  });
});
