/// <reference types="Cypress" />

describe("Login flow", () => {
  it("Creates admin and logs in", () => {
    cy.visit("http://127.0.0.1:3000/debug");
    cy.contains("Create admin test users").click();
    cy.intercept("POST", "/eisbuk/europe-west6/createOrganization").as(
      "createOrganization"
    );

    cy.wait("@createOrganization").then(({ request }) => {
      expect(request.body).to.have.property("data");
    });

    // cy.pause()

    cy.visit("http://127.0.0.1:3000/login");
    cy.contains("Sign in with email").click();
    cy.url().should("include", "/login");
    cy.get("[type='email']").type("test@eisbuk.it");
    cy.contains("Next").click();
    cy.get("[type='password']").type("test00");
    cy.contains("Sign In").click();
    // needs to logout after each test run
  });
});
