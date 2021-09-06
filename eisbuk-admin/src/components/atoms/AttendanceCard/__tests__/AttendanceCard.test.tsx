import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import AttendanceCard from "../AttendanceCard";
import * as attendanceOperations from "@/store/actions/attendanceOperations";
import { Category, SlotType } from "eisbuk-shared";
import { customersSlot } from "../__testData__/dummyData";
import i18n from "i18next";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));
const mockMarkAttImplementation = (payload: {
  slotId: string;
  userId: string;
  attended: boolean;
}) => ({
  payload,
});
jest
  .spyOn(attendanceOperations, "markAttendance")
  .mockImplementation(mockMarkAttImplementation);

const spyT = jest.spyOn(i18n, "t");
beforeEach(() => spyT.mockClear());
describe("AttendanceCard", () => {
  describe("Smoke test", () => {
    beforeEach(() => {
      render(<AttendanceCard {...customersSlot} />);
    });
    test("should render props", () => {
      screen.getByText("13:00 - 15:00");
      screen.getByText("Saul");
      screen.getByText("Walter");
      /** @TODO move back to getByText when i18next is implemented */
      // screen.getByText(Category.Competitive);
      expect(spyT).toHaveBeenCalledWith(`Categories.${Category.Competitive}`);
      expect(spyT).toHaveBeenCalledWith(`SlotTypes.${SlotType.Ice}`);
    });
  });
  describe("Test marking attendance functionality", () => {
    beforeEach(() => {
      render(<AttendanceCard {...customersSlot} />);
    });
    test("should dispatch markAttendance with correct args", () => {
      screen.getByText("👎").click();
      expect(mockDispatch).toHaveBeenCalledWith(
        mockMarkAttImplementation({
          slotId: "123",
          userId: "saul",
          attended: false,
        })
      );
    });
    test("should disable attendance button while state and fb are synching", () => {
      screen.getByText("👎").click();
      expect(screen.getByTestId("SaulGoodman")).toHaveProperty(
        "disabled",
        true
      );
    });
    /** @TODO find a good test for options */
    test("should render intervals in dropdown when athlete is present", () => {
      screen.getByText("👎").click();
      expect(screen.getByTestId("SaulGoodmanDropdown")).toBeInTheDocument();

      // expect(screen.getAllByTestId("SaulGoodman13:00 - 14:00").length).toEqual(
      //   customersSlot.intervals.length
      // );
    });
    test("should render bookedInterval value as display value", () => {
      screen.getByText("👎").click();
      expect(screen.getByTestId("SaulGoodmanSelect")).toBeInTheDocument();
      const firstOption = screen.getByTestId("SaulGoodmanSelect").firstChild;
      expect(firstOption).toHaveTextContent("13:00 - 14:00");
    });
    test("should change bookedInterval to selected value", () => {
      fireEvent.change(screen.getByTestId("SaulGoodmanDropdown"), {
        target: { value: "13:15 - 14:15" },
      });
      expect(screen.getByTestId("SaulGoodmanDropdown")).toHaveDisplayValue(
        "13:15 - 14:15"
      );
    });
  });
});
