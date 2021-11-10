/// <reference types="Cypress" />
import { saul } from "@/__testData__/customers";
import { v4 as uuidv4 } from "uuid";

beforeEach(() => {
  const id = uuidv4();
  cy.on("window:before:load", (win) => {
    win.localStorage.setItem("organization", id);
  });
  cy.visit(`localhost:3000/debug`);

  cy.contains("Create admin test users").click();
  cy.intercept("POST", "/eisbuk/europe-west6/createOrganization").as(
    "createOrganization"
  );

  cy.intercept(
    "POST",
    "www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=fake-key"
  ).as("signupNewUser");

  cy.wait("@createOrganization").then(({ request }) => {
    expect(request.body).to.have.property("data");
  });
  cy.wait("@signupNewUser").then(({ request }) => {
    expect(request.body).to.have.property("email", "test@eisbuk.it");
  });
});
describe("add athlete", () => {
  it("should fill in the customer form and submit it", () => {
    // cy.pause()

    // cy.visit(`localhost:3000/login`);
    // cy.contains("Sign in with email").click();
    // cy.url().should("include", "/login");
    // cy.get("[type='email']").type("test@eisbuk.it");
    // cy.contains("Next").click();
    // cy.get("[type='password']").type("test00");
    // cy.contains("Sign In").click();
    // needs to logout after each test run
    cy.visit(`localhost:3000/atleti`);
    cy.get("[data-testid='addAthlete']").click();
    cy.get("[name='name']").type(saul.name);
    cy.get("[name='surname']").type(saul.surname);
    cy.get("[name='email']").type(saul.email);
    cy.get("[name='phone']").type(saul.phone);
    cy.get("[placeholder='dd/mm/yyyy']").first().type(saul.birthday);
    cy.get("[value='competitive']").check();
    cy.get("[placeholder='dd/mm/yyyy']")
      .eq(`1`)
      .type(saul.certificateExpiration);
    cy.get("[placeholder='dd/mm/yyyy']")
      .eq(`2`)
      .type(saul.covidCertificateReleaseDate);
    cy.get("[type='checkbox']").check();
    cy.get("[type='submit']").click();
    cy.contains(`${saul.name} ${saul.surname} update`);
  });
});
