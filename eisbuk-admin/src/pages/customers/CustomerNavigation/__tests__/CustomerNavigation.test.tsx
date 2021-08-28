import React from "react";
import { render } from "@testing-library/react";

import CustomerNavigation from "../CustomerNavigation";

describe("CustomerNavigation", () => {
  describe("Smoke test", () => {
    test("should render", () => {
      render(<CustomerNavigation />);
    });
  });
});
