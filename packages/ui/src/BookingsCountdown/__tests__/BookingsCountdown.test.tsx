import React from "react";
import { render } from "@testing-library/react";

import BookingsCountdown from "../BookingsCountdown";

describe("BookingsCountdown", () => {
  test("smoke test", () => {
    render(<BookingsCountdown />);
  });
});
