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
  it("should enter invalid date format and fail to submit form", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();
    cy.getAttrWith("name", "name").type(saul.name);
    cy.getAttrWith("name", "surname").type(saul.surname);
    cy.getAttrWith("name", "email").type(saul.email);
    cy.getAttrWith("name", "phone").type(saul.phone);
    cy.getAttrWith("placeholder", "dd/mm/yyyy").first().type("12 nov 2021");
    cy.getAttrWith("value", "competitive").check();
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .eq(1)
      .type(saul.certificateExpiration);
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .eq(2)
      .type(saul.covidCertificateReleaseDate);
    cy.getAttrWith("type", "checkbox").check();
    cy.getAttrWith("type", "submit").click();
    cy.contains(`Invalid date format ("dd/mm/yyyy")`);
  });
  it("should enter different date separators and check that they're replaced with /", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();
    cy.getAttrWith("name", "name").type(saul.name);
    cy.getAttrWith("name", "surname").type(saul.surname);
    cy.getAttrWith("name", "email").type(saul.email);
    cy.getAttrWith("name", "phone").type(saul.phone);
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .first()
      .type("12-12-1990")
      .blur();

    cy.getAttrWith("value", "12/12/1990").clear();
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .first()
      .type("12.12.1990")
      .blur();
    cy.getAttrWith("value", "12/12/1990");

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
