import React from "react";
import { render, screen } from "@testing-library/react";

import AttendanceCard from "../AttendanceCard";

// import * as attendanceOperations from "@/store/actions/attendanceOperations";
import { Category } from "eisbuk-shared";
import { dummySlot } from "../__testData__/dummyData";

/**
 * Mocked `markAttendance` function, expect it to have been called when needed
 */
// const mockMarkAttendance = jest.spyOn(attendanceOperations, "markAttendance");

describe("AttendanceCard", () => {
  // write all of the tests (grouped by another describe) within this block
  describe("Smoke test", () => {
    beforeEach(() => {
      render(<AttendanceCard {...dummySlot} />);
    });
    test("should render props", () => {
      expect(screen.getByText("13:00 - 15:00"));
      screen.getByText("Saul");
      screen.getByText("Walter");
      screen.getByText(Category.Competitive);
    });
  });
});
