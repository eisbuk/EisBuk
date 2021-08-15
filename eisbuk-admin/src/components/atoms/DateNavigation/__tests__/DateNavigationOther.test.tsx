import React from "react";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";

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
      screen.getByTestId(__toggleId__).click();
      await screen.findByText(toggleTrue);
    });
  });
});
