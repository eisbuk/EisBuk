import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import AttendanceCard from "../AttendanceCard";
import * as attendanceOperations from "@/store/actions/attendanceOperations";
import { Category, Customer, Slot, SlotType } from "eisbuk-shared";
import { customersSlot } from "../__testData__/dummyData";

import i18n from "i18next";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));
const mockMarkAttendanceImplementation = (payload: {
  slotId: Slot<"id">["id"];
  customerId: Customer["id"];
  attendedInterval: string;
}) => ({
  payload,
});
const mockMarkAbsenceImplementation = (payload: {
  slotId: Slot<"id">["id"];
  customerId: Customer["id"];
}) => ({
  payload,
});

jest
  .spyOn(attendanceOperations, "markAttendance")
  .mockImplementation(mockMarkAttendanceImplementation as any);

jest
  .spyOn(attendanceOperations, "markAbsence")
  .mockImplementation(mockMarkAbsenceImplementation as any);

const spyT = jest.spyOn(i18n, "t");
beforeEach(() => spyT.mockClear());
describe("AttendanceCard", () => {
  describe("Smoke test", () => {
    beforeEach(() => {
      render(<AttendanceCard {...customersSlot} />);
    });
    test("should render props", () => {
      screen.getByText("13:00 - 14:15");
      screen.getByText("Saul");
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
    // test("should dispatch markAttendance with correct args", () => {
    //   screen.getByText("👎").click();
    //   expect(mockDispatch).toHaveBeenCalledWith(
    //     mockMarkAttImplementation({
    //       slotId: "123",
    //       customerId: "saul",
    //       attended: false,
    //     })
    //   );
    // });
    test("should disable attendance button while state and fb are synching", () => {
      screen.getByText("👎").click();
      expect(screen.getByTestId("attendance-button")).toHaveProperty(
        "disabled",
        true
      );
    });
    /** @TODO find a good test for options */
    test("should render intervals in dropdown when athlete is present", () => {
      screen.getByText("👎").click();
      screen.getByTestId("select");

      screen.getByText("13:00-14:00");
      screen.getByText("13:15-14:15");
    });
    test("should render bookedInterval value as display value", () => {
      screen.getByText("👎").click();
      screen.getByTestId("select");
      const firstOption = screen.getByTestId("select").firstChild;
      expect(firstOption).toHaveTextContent("13:00-14:00");
    });

    test("should disable dropdown when athlete is marked absent", () => {
      screen.getByText("👎").click();

      screen.getByText("👍").click();
      expect(screen.getByTestId("select")).toHaveProperty("disabled", true);
    });
    test("should dispatch MarkAbsence with correct args", () => {
      screen.getByText("👎").click();
      expect(mockDispatch).toHaveBeenCalledWith(
        mockMarkAbsenceImplementation({
          slotId: "123",
          customerId: "saul",
        })
      );
    });
  });
});
