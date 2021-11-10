import React from "react";
import { screen, render } from "@testing-library/react";

import SlotsDayContainer from "../SlotsDayContainer";

import { testDateLuxon } from "@/__testData__/date";

describe("SlotsDayContainer", () => {
  describe("Render test", () => {
    test("should render children", () => {
      const testString = "test-string";
      render(
        <SlotsDayContainer date={testDateLuxon}>
          {() => <>{testString}</>}
        </SlotsDayContainer>
      );
      screen.getByText(testString);
    });

    test("should render additional buttons if provided and 'showAdditionalButtons=true'", () => {
      const additionalButtons = <button />;
      render(
        <SlotsDayContainer
          date={testDateLuxon}
          additionalButtons={additionalButtons}
          showAdditionalButtons
        />
      );
      screen.getByRole("button");
    });

    test("should not render additional buttons if 'showAdditionalButtons=false'", () => {
      const additionalButtons = <button />;
      render(
        <SlotsDayContainer
          date={testDateLuxon}
          additionalButtons={additionalButtons}
          showAdditionalButtons={false}
        />
      );
      const buttonOnScreen = screen.queryByRole("button");
      expect(buttonOnScreen).toEqual(null);
    });
  });
});
