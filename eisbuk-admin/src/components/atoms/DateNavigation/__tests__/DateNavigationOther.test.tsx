/**
 * @jest-environment jsdom-sixteen
 */

import React from "react";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Button from "@material-ui/core/Button";

import DateNavigation from "../DateNavigation";

import { __toggleId__ } from "../__testData__/testData";

import { renderWithRouter } from "@/__testUtils__/wrappers";

describe("DateNavigation", () => {
  describe("Test toggle button functionality", () => {
    test("should not render toggle button if 'showToggle = false'", () => {
      renderWithRouter(<DateNavigation />);
      expect(screen.queryByTestId(__toggleId__)).toEqual(null);
    });

    test("should pass toggle state to render function", async () => {
      const toggleTrue = "Toggle: true";
      const toggleFalse = "Toggle: false";
      renderWithRouter(
        <DateNavigation showToggle>
          {({ toggleState }) => (toggleState ? toggleTrue : toggleFalse)}
        </DateNavigation>
      );
      screen.getByText(toggleFalse);
      // this isn't so straight forward, this "checkbox" is the toggle button
      // `getByTestId().click()` doesn't work here for some reason
      // this was a suggested solution in an exact same case: https://github.com/mui-org/material-ui/issues/17697
      screen.getByRole("checkbox").click();
      await screen.findByText(toggleTrue);
    });

    test("if 'showToggle == true', should show 'extraButtons' only if 'toggleState === true'", () => {
      const extraButtons = (
        <>
          {Array(2)
            .fill(null)
            .map((_, i) => (
              <Button key={i} />
            ))}
        </>
      );
      renderWithRouter(
        <DateNavigation showToggle extraButtons={extraButtons} />
      );
      const numButtonsBeforeToggle = screen.queryAllByRole("button").length;
      expect(numButtonsBeforeToggle).toEqual(2);
      // we're expecting two initial buttons (arrows) and no additional buttons
      screen.getByRole("checkbox").click();
      const numButtonsAfterToggle = screen.queryAllByRole("button").length;
      // we're expecting two initial buttons (arrows) and two additional (extra buttons)
      expect(numButtonsAfterToggle).toEqual(4);
    });

    test("if 'showToggle == false', should show 'extraButtons' immediately", () => {
      const extraButtons = (
        <>
          {Array(2)
            .fill(null)
            .map((_, i) => (
              <Button key={i} />
            ))}
        </>
      );
      renderWithRouter(<DateNavigation extraButtons={extraButtons} />);
      const numButtonsBeforeToggle = screen.queryAllByRole("button").length;
      // expect all four buttons (arrows and test buttons) to be rendered immediately
      expect(numButtonsBeforeToggle).toEqual(4);
    });
  });
});
