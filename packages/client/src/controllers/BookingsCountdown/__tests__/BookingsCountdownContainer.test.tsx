import { render } from "@testing-library/react";
import React from "react";

import BookingsCountdownContainer from "../BookingsCountdownContainer";

describe("BookingsCountdownContainer", () => {
  test("smoke test", () => {
    render(<BookingsCountdownContainer />);
  });
});
