import React from "react";
import { render, screen } from "@testing-library/react";
import AttendanceCard from "../AttendanceCard";

import * as attendanceOperations from "@/store/actions/attendanceOperations";
import { Category } from "eisbuk-shared";
import { customersSlot, emptySlot } from "../__testData__/dummyData";

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
  describe("Smoke test", () => {
    beforeEach(() => {
      render(<AttendanceCard {...customersSlot} />);
    });
    test("should render props", () => {
      screen.getByText("13:00 - 15:00");
      screen.getByText("Saul");
      screen.getByText("Walter");
      screen.getByText(Category.Competitive);
    });
  });
  describe("Test marking attendance functionality", () => {
    beforeEach(() => {
      render(<AttendanceCard {...customersSlot} />);
    });
    test("should dispatch markAttendance with correct args", () => {
      screen.getByText("👎").click();
      expect(mockDispatch).toHaveBeenCalledWith(
        mockMarkAttImplementation("heisenberg", true)
      );
    });
  });
});
