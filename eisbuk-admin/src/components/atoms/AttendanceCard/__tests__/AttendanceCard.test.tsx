import React from "react";
import { render, screen } from "@testing-library/react";

import AttendanceCard from "../AttendanceCard";

import * as attendanceOperations from "@/store/actions/attendanceOperations";
import { Category, Duration, SlotType } from "eisbuk-shared";
import { users } from "../__testData__/dummyData";
import { DateTime } from "luxon";
import { luxonToFB } from "@/utils/date";
/**
 * Mocked `markAttendance` function, expect it to have been called when needed
 */
const mockMarkAttendance = jest.spyOn(attendanceOperations, "markAttendance");

describe("AttendanceCard", () => {
  // write all of the tests (grouped by another describe) within this block
  describe("Smoke test", () => {
    beforeEach(() => {
      render(
        <AttendanceCard
          date={luxonToFB(DateTime.fromISO("2021-05-25T09:00:00.123"))}
          durations={[
            Duration["1.5h"],
            Duration["2h"],
            Duration["3h"],
            Duration["4h"],
            Duration["5h"],
          ]}
          type={SlotType.Ice}
          userBookings={users}
          categories={[Category.Competitive]}
          absentees={["heisenberg"]}
          notes=""
          id="123"
        />
      );
    });
    test("should render props", () => {
      expect(screen.getByTestId("timeString")).toBe("9-14");
      screen.getByText("Saul");
      screen.getByText("Walter");
      screen.getByText(Category.Competitive);
    });
  });
});
