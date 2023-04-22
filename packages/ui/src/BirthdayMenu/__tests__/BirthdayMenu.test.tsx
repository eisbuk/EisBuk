import { vi, beforeEach, afterEach, expect, test, describe } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { DateTime } from "luxon";

import i18n, { BirthdayMenu as BirthdayMenuLabel } from "@eisbuk/translations";

import BirthdayMenu from "../BirthdayMenu";

import * as customerRecord from "../../__testData__/customers";

const { saul } = customerRecord;

const customers = Object.values(customerRecord);

const birthdays = customers.map((customer, ix) => ({
  date: DateTime.now().plus({ days: ix }).toISODate().substring(5),
  customers: [customer],
}));

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

describe("BirthdayMenu", () => {
  const mockShowAllClick = vi.fn();
  const mockCustomerClick = vi.fn();

  beforeEach(() => {
    render(
      <BirthdayMenu
        birthdays={birthdays}
        onCustomerClick={mockCustomerClick}
        onShowAll={mockShowAllClick}
      />
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should display only the first 5 customers", () => {
    // Open the popup
    screen.getByRole("button").click();
    customers.slice(0, 5).forEach((customer) => {
      screen.getByText(`${customer.name} ${customer.surname}`);
    });
    // 6th customer shouldn't be displayed
    const { name, surname } = customers[5];
    expect(screen.queryByText(`${name} ${surname}`)).toBeNull();
  });

  test('should propagate "show all" click', () => {
    // Open the popup
    screen.getByRole("button").click();
    screen.getByText(i18n.t(BirthdayMenuLabel.ShowAll) as string).click();
    expect(mockShowAllClick).toHaveBeenCalled();
  });

  test("should propagate customer click", () => {
    // Open the popup
    screen.getByRole("button").click();
    screen.getByText(`${saul.name} ${saul.surname}`).click();
    expect(mockCustomerClick).toHaveBeenCalledWith(saul.id);
  });
});
