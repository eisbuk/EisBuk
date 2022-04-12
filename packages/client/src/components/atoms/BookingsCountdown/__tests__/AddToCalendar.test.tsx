/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen } from "@testing-library/react";
import * as reactRedux from "react-redux";

import AddToCalendar from "../AddToCalendar";
import { __addToCalendarButtonId__ } from "@/__testData__/testIds";
import { renderWithRedux } from "@/__testUtils__/wrappers";

const mockDispatch = jest.fn();
jest.spyOn(reactRedux, "useDispatch").mockImplementation(() => mockDispatch);

describe("Add To Calendar", () => {
  describe("Smoke Test", () => {
    test("should render component", () => {
      renderWithRedux(<AddToCalendar />);
      screen.getByTestId(__addToCalendarButtonId__);
    });
  });
});
