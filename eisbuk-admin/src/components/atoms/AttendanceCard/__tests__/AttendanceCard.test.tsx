import React from "react";
import { render, screen } from "@testing-library/react";
import AttendanceCard from "../AttendanceCard";

import * as attendanceOperations from "@/store/actions/attendanceOperations";
import { Category } from "eisbuk-shared";
import { dummySlot } from "../__testData__/dummyData";

const mockMarkAttImplementation = (customerId: string, attended: boolean) => ({
  customerId,
  attended,
});
jest
  .spyOn(attendanceOperations, "markAttendance")
  .mockImplementation(mockMarkAttImplementation);

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
      screen.getByText("13:00 - 15:00");
      screen.getByText("Saul");
      screen.getByText("Walter");
      screen.getByText(Category.Competitive);
    });
    test("should dispatch markAttendance with correct args", () => {
      screen.getByText("Mark Walter as present").click();
      expect(mockDispatch).toHaveBeenCalledWith(
        mockMarkAttImplementation("heisenberg", true)
      );
    });
  });
});
