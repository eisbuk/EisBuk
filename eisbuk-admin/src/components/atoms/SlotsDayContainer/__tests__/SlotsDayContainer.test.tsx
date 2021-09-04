import React from "react";
import { screen, render } from "@testing-library/react";
import { DateTime } from "luxon";

import SlotsDayContainer from "../SlotsDayContainer";

const testDateISO = "2021-03-01";
const testDate = DateTime.fromISO(testDateISO);

describe("SlotsDayContainer", () => {
  describe("Render test", () => {
    test("should render children", () => {
      const testString = "test-string";
      render(
        <SlotsDayContainer date={testDate}>{testString}</SlotsDayContainer>
      );
      screen.getByText(testString);
    });

    test("should render additional buttons if provided and 'showAdditionalButtons=true'", () => {
      const additionalButtons = <button />;
      render(
        <SlotsDayContainer
          date={testDate}
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
          date={testDate}
          additionalButtons={additionalButtons}
          showAdditionalButtons={false}
        />
      );
      const buttonOnScreen = screen.queryByRole("button");
      expect(buttonOnScreen).toEqual(null);
    });
  });
});
