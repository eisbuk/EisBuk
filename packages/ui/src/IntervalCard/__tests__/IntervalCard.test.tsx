import React from "react";
import { render } from "@testing-library/react";

import IntervalCard from "../IntervalCard";

describe("IntervalCard", () => {
  test("smoke test", () => {
    render(<IntervalCard />);
  });
});
