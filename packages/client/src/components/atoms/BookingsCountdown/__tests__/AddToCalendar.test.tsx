/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render } from "@testing-library/react";
import * as reactRedux from "react-redux";

import AddToCalendar from "../AddToCalendar";
import { __addToCalendarButtonId__ } from "@/__testData__/testIds";

const mockDispatch = jest.fn();
jest.spyOn(reactRedux, "useDispatch").mockImplementation(() => mockDispatch);
// mock createObjectURL
global.URL.createObjectURL = jest.fn();
// write a test for creating an event
describe("Add To Calendar", () => {
  describe("Smoke Test", () => {
    test("should render component", () => {
      render(<AddToCalendar />);
      screen.getByTestId(__addToCalendarButtonId__);
    });
  });
});
