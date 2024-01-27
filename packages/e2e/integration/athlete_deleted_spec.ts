import { Customer } from "@eisbuk/shared";
import { Routes } from "@eisbuk/shared/ui";

import { customers } from "../__testData__/customers.json";

const saul = customers.saul as Customer;

describe("Deleted athlete redirects", () => {
  it("Navigates to deleted athlete customer_area and redirects to deleted page", () => {
    cy.initAdminApp().then((organization) =>
      cy.updateCustomers(organization, {
        customers: { ...saul, deleted: true },
      } as Record<string, Customer>)
    );

    cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
    cy.url().should("include", "deleted");

    cy.contains("dummy@email.com");
  });

  it("Redirects to appropriate customer area page if the athlete is not deleted", () => {
    cy.initAdminApp()
      .then((organization) =>
        cy.updateCustomers(organization, {
          customers: { ...saul, deleted: false },
        } as Record<string, Customer>)
      )
      // We want the unauthenticated context for this one
      .then(() => cy.visit([Routes.Deleted, saul.secretKey].join("/")));

    cy.url().should("include", "customer_area");
    cy.url().should("include", saul.secretKey);
  });

  it("Redirects to the login route if no secret key and user not authenticated", () => {
    // We're testing with unauthenticated context -> default route is /login
    cy.initAdminApp()
      .then(() => cy.signOut())
      .then(() => cy.visit(Routes.Deleted));

    cy.url().should("include", "login");
  });
});
