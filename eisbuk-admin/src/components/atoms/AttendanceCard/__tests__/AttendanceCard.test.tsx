import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AttendanceCard from "../AttendanceCard";

import * as attendanceOperations from "@/store/actions/attendanceOperations";
import { Category } from "eisbuk-shared";
import { dummySlot } from "../__testData__/dummyData";

/**
 * Mocked `markAttendance` function, expect it to have been called when needed
 */
const mockMarkAttendance = jest.spyOn(attendanceOperations, "markAttendance");

mockMarkAttendance.mockImplementation(
  (customerId: string, attended: boolean) => ({
    customerId,
    attended,
  })
);
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));
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
    test("should dispatch markAttendance with correct args", () => {
      userEvent.click(screen.getByText("Mark Walter as present"));
      expect(mockDispatch).toHaveBeenCalledWith({
        customerId: "heisenberg",
        attended: true,
      });
    });
  });
});
