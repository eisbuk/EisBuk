import React from "react";
import { render, screen } from "@testing-library/react";
import UserAttendance from "./UserAttendance";

describe("user attendance", () => {
  const props = {
    name: "Saul",
    key: "123",
    // user:
  };
  describe("render userAttendance component", () => {
    render(<UserAttendance {...props} />);
    test("render userAttendance", () => {
      screen.getByText("Saul");
    });
  });
});
