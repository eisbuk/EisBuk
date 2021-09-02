import React from "react";
import { render, screen } from "@testing-library/react";
import AttendanceCard from "../AttendanceCard";

import { Category, SlotType } from "eisbuk-shared";
import { customersSlot } from "../__testData__/dummyData";
import i18n from "i18next";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

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
      // TODO: move back to getByText when i18next is implemented
      // screen.getByText(Category.Competitive);
      expect(spyT).toHaveBeenCalledWith(`Categories.${Category.Competitive}`);
      expect(spyT).toHaveBeenCalledWith(`SlotTypes.${SlotType.Ice}`);
    });
  });
});
