import React from "react";
import { render } from "@testing-library/react";

import AttendanceCard from "../AttendanceCard";

import * as attendanceOperations from "@/store/actions/attendanceOperations";

/**
 * Mocked `markAttendance` function, expect it to have been called when needed
 */
const mockMarkAttendance = jest.spyOn(attendanceOperations, "markAttendance");

describe("AttendanceCard", () => {
  // write all of the tests (grouped by another describe) within this block
  describe("Smoke test", () => {
    test("should render without error", () => {
      render(<AttendanceCard />);
    });
  });
});
