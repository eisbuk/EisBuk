import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import NewSlotForm from "../components/slots/SlotForm/NewSlotForm";
import { DateTime } from "luxon";

describe("NewSlotForm", () => {
  describe("time validation", () => {
    test("should print error message when startTime > endTime and vice versa", () => {
      // a dummy date we're using for tests
      const testDateISO = "2021-03-01";

      // a dummy date comverted to DateTime for easier processing
      const testDate = DateTime.fromISO(testDateISO);
      render(<NewSlotForm open={true} isoDate="2021-03-01" />);
      const test = screen.getByTestId("startTime-error");
      userEvent.type(screen.getByTestId("startTime"), "");
      expect(test).toBe("Start Time is required");
    });
  });
});
