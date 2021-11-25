/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import { PrivateRoutes } from "@/enums/routes";

import { saul } from "@/__testData__/customers";

describe("add athlete", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    cy.initAdminApp();
  });
  it("should fill in the customer form and submit it", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.get("[data-testid='add-athlete']").click();
    cy.get("[name='name']").type(saul.name);
    cy.get("[name='surname']").type(saul.surname);
    cy.get("[name='email']").type(saul.email);
    cy.get("[name='phone']").type(saul.phone);
    cy.get("[placeholder='dd/mm/yyyy']").first().type(saul.birthday);
    cy.get("[value='competitive']").check();
    cy.get("[placeholder='dd/mm/yyyy']").eq(1).type(saul.certificateExpiration);
    cy.get("[placeholder='dd/mm/yyyy']")
      .eq(2)
      .type(saul.covidCertificateReleaseDate);
    cy.get("[type='checkbox']").check();
    cy.get("[type='submit']").click();
    cy.contains(`${saul.name} ${saul.surname} update`);
  });
});
