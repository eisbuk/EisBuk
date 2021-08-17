import React from "react";
import { render } from "@testing-library/react";

// import SlotCard from "../SlotCard";

// import { dummySlot } from "../__testData__";

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => jest.fn(),
}));

jest.mock;

describe("SlotCard", () => {
  describe("Smoke test", () => {
    test("test", () => {
      render(<div>temp</div>);
    });
  });
});
