/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen } from "@testing-library/react";
import { DateTime } from "luxon";

import i18n, { BirthdayMenu as BirthdayMenuLabel } from "@eisbuk/translations";

import BirthdayMenu from "../BirthdayMenu";

import { renderWithRouter } from "@/__testUtils__/wrappers";

import { saul, gus, jane, jian } from "@/__testData__/customers";

const customers = [
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

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("BirthdayMenu", () => {
  describe("Smoke test", () => {
    beforeEach(() => {
      renderWithRouter(<BirthdayMenu customers={customers} />);
      jest.clearAllMocks();
    });

    test("should display existing customers in 3 dates only", () => {
      screen.getByText(`${saul.name} ${saul.surname}`);
      screen.getByText(`${gus.name} ${gus.surname}`);
      expect(screen.queryByText(`${jian.name} ${jian.surname}`)).toBeNull();
    });

    test("should open a BidthdayDialog modal on 'show all' click", () => {
      screen.getByText(i18n.t(BirthdayMenuLabel.ShowAll) as string).click();
      const dispatchCallPayload = mockDispatch.mock.calls[0][0].payload;
      expect(dispatchCallPayload.component).toEqual("BirthdayDialog");
      expect(dispatchCallPayload.props).toEqual({ customers });
    });
  });
});
