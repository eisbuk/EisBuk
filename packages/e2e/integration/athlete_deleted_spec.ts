import { Customer } from "@eisbuk/shared";

import { Routes } from "../temp";

import { customers } from "../__testData__/customers.json";

const saul = customers.saul as Customer;

describe("Deleted athlete redirect", () => {
  beforeEach(() => {
    cy.initAdminApp().then((organization) =>
      cy.updateCustomers(organization, {
        customers: { ...saul, deleted: true },
      } as Record<string, Customer>)
    );
  });

  it("Navigates to deleted athlete customer_area and redirects to deleted page", () => {
    cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
    cy.url().should("include", "deleted");

    cy.contains("dummy@email.com");
  });
});
