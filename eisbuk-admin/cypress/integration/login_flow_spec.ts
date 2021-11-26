import { Routes, PrivateRoutes } from "@/enums/routes";

describe("login", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization but don't sign in
    cy.initAdminApp(false);
  });
  it("can log in", () => {
    cy.visit(PrivateRoutes.Root);
    cy.contains("Sign in with email").click();
    cy.url().should("include", Routes.Login);
    cy.get("[type='email']").type("test@eisbuk.it");
    cy.contains("Next").click();
    cy.get("[type='password']").type("test00");
    cy.contains("Sign In").click();
  });
});
