import React from "react";
import { render } from "@testing-library/react";

import CalendarNav from "../CalendarNav";

describe("CalendarNav", () => {
  test("smoke test", () => {
    render(<CalendarNav />);
  });
});
