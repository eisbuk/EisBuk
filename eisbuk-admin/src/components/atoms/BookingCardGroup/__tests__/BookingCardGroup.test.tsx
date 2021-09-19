import React from "react";
import { render, screen } from "@testing-library/react";

import BookingCardGroup from "../BookingCardGroup";

import { __bookingCardId__ } from "@/__testData__/testIds";
import { intervals, slot } from "../__testData__/dummyData";

describe("Booking Card Group ->", () => {
  describe("Smoke test ->", () => {
    test("should render", () => {
      render(<BookingCardGroup {...slot} />);
    });
  });

  describe("Test local functionality ->", () => {
    const bookedInterval = Object.keys(intervals)[0];

    beforeEach(() => {
      render(<BookingCardGroup {...{ ...slot, bookedInterval }} />);
    });

    test("should fade the booked interval", () => {
      /** @FOR_FADWA uncomment this to start */
      //   const intervalCards = screen.getAllByTestId(__bookingCardId__);
      //   /**
      //    * We're using `data-faded` property to test that the `faded` has been passed properly,
      //    * as there is no way to test CSS styling. This is what we want for now and I will add CSS logic later.
      //    * Use this property for the other tests as well
      //    */
      //   expect(intervalCards[0]).toHaveProperty("data-faded", true);
    });

    test("should switch booked interval on 'bookInterval' click (on a non-booked interval)", () => {});

    test("should remove booked interval on 'cancelBooking' click", () => {});
  });
});
