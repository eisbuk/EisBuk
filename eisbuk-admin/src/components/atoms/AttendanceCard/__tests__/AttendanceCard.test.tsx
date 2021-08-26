import React from "react";
import { render, screen } from "@testing-library/react";

import AttendanceCard from "../AttendanceCard";

import * as attendanceOperations from "@/store/actions/attendanceOperations";
import { Category } from "../../../../../../eisbuk-shared/dist";

/**
 * Mocked `markAttendance` function, expect it to have been called when needed
 */
const mockMarkAttendance = jest.spyOn(attendanceOperations, "markAttendance");

describe("AttendanceCard", () => {
  // write all of the tests (grouped by another describe) within this block
  describe("Smoke test", () => {
    beforeEach(() => {
      const users = [
        {
          name: "Saul",
          surname: "Goodman",
          certificateExpiration: "2001-01-01",
          id: "saul",
        },
        {
          name: "Walter",
          surname: "White",
          id: "heisenberg",
          certificateExpiration: "2001-01-01",
        },
      ];
      render(
        <AttendanceCard
          time={"11-12"}
          userBookings={users}
          category={Category.Competitive}
        />
      );
    });
    test("should render time prop", () => {
      screen.getByText("11-12");
    });
    test("should render attendees", () => {
      screen.getByText("Saul");
      screen.getByText("Walter");
    });
    test("should render category", () => {
      screen.getByText("competitive");
    });
  });
});
