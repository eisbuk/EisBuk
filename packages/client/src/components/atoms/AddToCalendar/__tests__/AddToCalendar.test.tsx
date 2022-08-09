/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import * as reactRedux from "react-redux";

import AddToCalendar from "../AddToCalendar";

import { expectedIcsFile } from "../__testData__/testData";
import {
  __inputDialogSubmitId__,
  __emailInput__,
} from "@/__testData__/testIds";
import { renderWithRedux } from "@/__testUtils__/wrappers";

import * as bookingActions from "@/store/actions/bookingOperations";
import { saul } from "@/__testData__/customers";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import i18n, { ActionButton } from "@eisbuk/translations";

const mockSaul = saul;
jest.mock("react-router", () => ({
  useParams: () => ({ secretKey: mockSaul.secretKey }),
}));

// mock createObjectURL for file download method
global.URL.createObjectURL = jest.fn();

jest
  .spyOn(bookingActions, "sendICSFile")
  .mockImplementation((payload) => payload as any);

// mock functions and app packages because they
// get imported by utils/firebase used inside bookingActions
jest.mock("@firebase/functions", () => ({
  getFunctions: jest.fn(),
  httpsCallable: () => jest.fn(),
}));

jest.mock("@firebase/app", () => ({
  ...jest.requireActual("@firebase/app"),
  getApp: jest.fn(),
}));

const mockDispatch = jest.fn();
jest.spyOn(reactRedux, "useDispatch").mockImplementation(() => mockDispatch);

/**
 * @TODO make this test pass
 */
xdescribe("Add To Calendar", () => {
  describe("ICS File Email Test", () => {
    afterEach(() => {
      jest.clearAllMocks();
      cleanup();
    });
    testWithEmulator(
      "should call sendICSFile function when button is clicked",
      () => {
        renderWithRedux(<AddToCalendar />);
        screen.getByText(i18n.t(ActionButton.AddToCalendar) as string).click();

        screen
          .getByTestId(__emailInput__)
          .setAttribute("value", saul.email as string);

        expect(screen.getByTestId(__emailInput__)).toHaveDisplayValue(
          saul.email as string
        );
        screen.getByTestId(__inputDialogSubmitId__).click();

        expect(mockDispatch).toHaveBeenCalledTimes(2);
        expect(mockDispatch).toHaveBeenNthCalledWith(2, {
          secretKey: saul.secretKey,
          icsFile: expect.stringMatching(expectedIcsFile),
        });
      }
    );
  });
});
