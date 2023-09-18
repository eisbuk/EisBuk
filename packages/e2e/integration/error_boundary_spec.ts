import { Routes } from "../temp";

Cypress.on("uncaught:exception", () => {
  // Handles the error manually, return false to prevent failing the test
  return false;
});

describe("Error Boundary", () => {
  beforeEach(() => {
    cy.initAdminApp();
  });

  it("Checks for the fallback ui", () => {
    cy.visit(Routes.ErrorBoundary);

    cy.contains("dummy@email.com");
  });
});
