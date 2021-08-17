import React from "react";
import { render } from "@testing-library/react";

import SlotCard from "../SlotCard";

import { dummySlot } from "../__testData__";

import { renderWithRouter } from "@/__testUtils__/wrappers";

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => () => {},
}));

describe("SlotCard", () => {
  describe("Smoke test", () => {
    test("test", () => {
      renderWithRouter(<SlotCard {...dummySlot} />);
    });
  });
});
