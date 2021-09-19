import React from "react";
import { render } from "@testing-library/react";

import BookingCardGroup from "../BookingCardGroup";

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

    test("should fade the booked interval", () => {});

    test("should switch booked interval on 'bookInterval' click (on a non-booked interval)", () => {});

    test("should remove booked interval on 'cancelBooking' click", () => {});
  });
});
