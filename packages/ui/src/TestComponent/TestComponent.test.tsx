import React from "react";
import { render } from "@testing-library/react";

import TestComponent from "./TestComponent";

describe("TestComponent", () => {
  test("Should not break", () => {
    render(<TestComponent />);
  });
});
