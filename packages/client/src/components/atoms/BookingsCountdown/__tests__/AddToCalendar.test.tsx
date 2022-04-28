/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import * as reactRedux from "react-redux";

import AddToCalendar from "../AddToCalendar";
import { __addToCalendarButtonId__ } from "@/__testData__/testIds";
import { renderWithRedux } from "@/__testUtils__/wrappers";
import { bookedSlots } from "@/store/actions/__testData__/bookingOperations";
import * as bookingActions from "@/store/actions/bookingOperations";
import { saul } from "@/__testData__/customers";
import { testWithEmulator } from "@/__testUtils__/envUtils";

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

describe("Add To Calendar", () => {
  describe("Smoke Test", () => {
    afterEach(() => {
      jest.clearAllMocks();
      cleanup();
    });
    test("should render component", () => {
      renderWithRedux(<AddToCalendar bookedSlots={bookedSlots} />);
      screen.getByTestId(__addToCalendarButtonId__);
    });
    testWithEmulator(
      "should call sendICSFile function when button is clicked",
      () => {
        renderWithRedux(<AddToCalendar bookedSlots={bookedSlots} />);
        screen.getByTestId(__addToCalendarButtonId__).click();
        expect(mockDispatch).toHaveBeenCalledWith({
          secretKey: saul.secretKey,
          icsFile: "icsFileHere",
        });
      }
    );
  });
});
