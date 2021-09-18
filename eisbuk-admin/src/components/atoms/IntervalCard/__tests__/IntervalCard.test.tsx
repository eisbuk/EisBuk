import React from "react";
import { render } from "@testing-library/react";

import IntervalCard from "../IntervalCard";

import { baseProps } from "../__testData__/dummyData";

describe("Interval Card ->", () => {
  describe("Test button functionality ->", () => {
    test("delete this test when you add your own", () => {
      render(<IntervalCard {...baseProps} />);
    });
    test("should fire `bookInterval` on click, if the interval is not already booked", () => {});
    test("should fire `cancelBooking` on click, if the interval is booked", () => {});
  });
});
