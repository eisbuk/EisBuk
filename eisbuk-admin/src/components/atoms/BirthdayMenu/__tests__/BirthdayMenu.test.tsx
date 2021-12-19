import React from "react";
import { render, screen } from "@testing-library/react";

import BirthdayMenu from "../BirthdayMenu";

import { saul, gus, jane } from "@/__testData__/customers";
import { DateTime } from "luxon";

const CustomersByBirthday = [
  {
    birthday: DateTime.now().toISODate(),
    customers: [jane],
  },
  {
    birthday: "2009-12-23",
    customers: [saul],
  },
  {
    birthday: "2022-12-27",
    customers: [gus],
  },
];
describe("BirthdayMenu", () => {
  describe("Smoke test", () => {
    test("should display existing customers", () => {
      render(<BirthdayMenu customers={CustomersByBirthday} />);
      screen.getByText(saul.name);
      screen.getByText(gus.name);
    });
  });
});
