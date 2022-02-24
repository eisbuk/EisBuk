/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";

import BirthdayMenu from "../BirthdayMenu";

import { saul, gus, jane, jian } from "@/__testData__/customers";
import { DateTime } from "luxon";

const CustomersByBirthday = [
  {
    birthday: DateTime.now().toISODate(),
    customers: [jane],
  },
  {
    birthday: DateTime.now().plus({ days: 3 }).toISODate(),
    customers: [saul],
  },
  {
    birthday: DateTime.now().plus({ days: 5 }).toISODate(),
    customers: [gus],
  },
  {
    birthday: DateTime.now().plus({ days: 7 }).toISODate(),
    customers: [jian],
  },
];
describe("BirthdayMenu", () => {
  describe("Smoke test", () => {
    test("should display existing customers in 3 dates only", () => {
      render(
        <BirthdayMenu
          customers={CustomersByBirthday}
          onClickShowAll={() => {}}
        />
      );
      screen.getByText(`${saul.name} ${saul.surname}`);
      screen.getByText(`${gus.name} ${gus.surname}`);
      expect(screen.queryByText(`${jian.name} ${jian.surname}`)).toBeNull();
    });
  });
});
