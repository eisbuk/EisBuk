import React from "react";
import { screen } from "@testing-library/react";

import SlotsDayContainer from "../SlotsDayContainer";

import * as bookingsSelectors from "@/store/selectors/bookings";

import { renderWithRedux } from "@/__testUtils__/wrappers";

import { testDateLuxon } from "@/__testData__/date";

describe("SlotsDayContainer", () => {
  describe("Render test", () => {
    test("should render children", () => {
      const testString = "test-string";
      renderWithRedux(
        <SlotsDayContainer date={testDateLuxon}>
          {() => <>{testString}</>}
        </SlotsDayContainer>
      );
      screen.getByText(testString);
    });

    test("should render additional buttons if provided and 'showAdditionalButtons=true'", () => {
      const additionalButtons = <button />;
      renderWithRedux(
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
      renderWithRedux(
        <SlotsDayContainer
          date={testDateLuxon}
          additionalButtons={additionalButtons}
          showAdditionalButtons={false}
        />
      );
      const buttonOnScreen = screen.queryByRole("button");
      expect(buttonOnScreen).toEqual(null);
    });

    test("should pass 'lockBookings' to render prop function if bookings for a day should be locked", () => {
      const additionalButtons = <button />;
      const renderProp = jest.fn().mockReturnValue(null);
      // if bookings are allowed they should not be locked (as we're testing down below)
      jest
        .spyOn(bookingsSelectors, "getIsBookingAllowed")
        .mockReturnValue(() => true);
      renderWithRedux(
        <SlotsDayContainer
          date={testDateLuxon}
          additionalButtons={additionalButtons}
          showAdditionalButtons={false}
          children={renderProp}
        />
      );
      // we're expecting the render prop to have been called with
      // appropriate `lockBookings` value
      const { lockBookings } = renderProp.mock.calls[0][0];
      expect(lockBookings).toEqual(false);
    });
  });
});
