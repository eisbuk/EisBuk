import React from "react";
import { render, screen } from "@testing-library/react";

import CustomerList from "../CustomerList";

import { saul, gus } from "@/__testData__/customers";

/** Dummy functions to satisfy props interface @TODO test functionality with mocks */
const onDeleteCustomer = () => {};
const updateCustomer = () => {};

describe("CustomerList", () => {
  describe("Smoke test", () => {
    test("should display existing customers, omitting the deleted ones", () => {
      const deletedGus = { ...gus, deleted: true };
      const customers = [saul, deletedGus];
      render(
        <CustomerList {...{ customers, onDeleteCustomer, updateCustomer }} />
      );
      screen.getByText(saul.name);
      expect(screen.queryByText(gus.name)).toBeNull();
    });
  });
});
