import React from "react";
import { render, screen } from "@testing-library/react";
import UserAttendance from "../UserAttendance";
import { Saul } from "../__testData__/dummyData";
import * as attendanceOperations from "@/store/actions/attendanceOperations";
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

describe("userAttendance", () => {
  const props = {
    isAbsent: false,
    userBooking: Saul,
  };
  beforeEach(() => {
    render(<UserAttendance {...props} />);
  });
  describe("smoke test", () => {
    test("should render userAttendance props", () => {
      screen.getByText("Saul");
    });
    test("should dispatch markAttendance with correct args", () => {
      screen.getByText("👍").click();
      expect(mockDispatch).toHaveBeenCalledWith(
        mockMarkAttImplementation("saul", false)
      );
    });
  });
});
