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
    cy.getAttrWith("data-testid", "add-athlete").click();
    cy.getAttrWith("name", "name").type(saul.name);
    cy.getAttrWith("name", "surname").type(saul.surname);
    cy.getAttrWith("name", "email").type(saul.email);
    cy.getAttrWith("name", "phone").type(saul.phone);
    cy.getAttrWith("placeholder", "dd/mm/yyyy").first().type(saul.birthday);
    cy.getAttrWith("value", "competitive").check();
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .eq(1)
      .type(saul.certificateExpiration);
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .eq(2)
      .type(saul.covidCertificateReleaseDate);
    cy.getAttrWith("type", "checkbox").check();
    cy.getAttrWith("type", "submit").click();
    cy.contains(`${saul.name} ${saul.surname} update`);
  });
});
