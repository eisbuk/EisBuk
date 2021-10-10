import React from "react";
import { screen, render } from "@testing-library/react";
import * as reactRedux from "react-redux";

import BookingsCalendar from "../BookingsCalendar";

import { changeCalendarDate } from "@/store/actions/appActions";

import { bookedSlots, slots } from "../__testData__/dummyData";
import { __dateNavNextId__ } from "@/__testData__/testIds";
import { testDateLuxon } from "@/__testData__/date";

const mockDispatch = jest.fn();
jest.spyOn(reactRedux, "useDispatch").mockImplementation(() => mockDispatch);
// we're only reading calendar day from `useSelector`
jest.spyOn(reactRedux, "useSelector").mockImplementation(() => testDateLuxon);

describe("BookingsCalendar", () => {
  describe("Smoke test", () => {
    test("should not crash if no bookedSlots passed", () => {
      render(<BookingsCalendar {...{ bookedSlots: undefined, slots }} />);
    });
  });

  describe("Test pagination", () => {
    test("should paginate by week", () => {
      render(<BookingsCalendar {...{ bookedSlots, slots }} />);
      screen.getByTestId(__dateNavNextId__).click();
      // we're expecting next date to be a month jump from our first date
      const expectedDate = testDateLuxon.plus({ weeks: 1 });
      expect(mockDispatch).toHaveBeenCalledWith(
        changeCalendarDate(expectedDate)
      );
    });
  });
});
