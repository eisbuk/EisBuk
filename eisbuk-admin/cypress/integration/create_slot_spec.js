import { v4 as uuidv4 } from "uuid";

beforeEach(() => {
  const id = uuidv4();
  cy.on("window:before:load", (win) => {
    win.localStorage.setItem("organization", id);
  });
  cy.visit(`/debug`);

  cy.intercept("POST", "/eisbuk/europe-west6/createOrganization").as(
    "createOrganization"
  );
  cy.intercept(
    "POST",
    "www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser*"
  ).as("signupNewUser");
  cy.intercept(
    "POST",
    "www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword*"
  ).as("signinOldUser");

  cy.contains("Create admin test users").click();

  cy.wait("@createOrganization").then(({ request }) => {
    expect(request.body).to.have.property("data");
  });
  cy.wait("@signupNewUser").then(({ request }) => {
    expect(request.body).to.have.property("email", `test@eisbuk.it`);
  });

  cy.wait("@signinOldUser").then(({ request }) => {
    expect(request.body).to.have.property("email", `test@eisbuk.it`);
  });
});

describe("Create slot", () => {
  it("fills in slot form and submits it", () => {
    cy.visit("/prenotazioni");
    cy.get("[type='checkbox']").click();
    cy.get("[data-testid='new-slot-button']").first().click();
    cy.get("[value='ice']").check();
    cy.get("[value='competitive']").check();
    cy.get("[type='text']").eq(0).clear().type("09:00");
    cy.get("[type='text']").eq(1).clear().type("10:30");
    cy.get("[name='notes']").type("some notes");
    cy.get("[type='submit']").click();

    //check for created slot or snackbar

    // tst for disabled checkbox
  });
  it("creates an off-ice slot", () => {
    cy.visit("/prenotazioni");
    cy.get("[type='checkbox']").click();
    cy.get("[data-testid='new-slot-button']").first().click();
    cy.get("[value='off-ice-dancing']").check();

    //check for value of the entire checkbox to be disabled
    cy.get("[value='competitive']").should("be.disabled");

    cy.get("[type='text']").eq(0).clear().type("09:00");
    cy.get("[type='text']").eq(1).clear().type("10:30");
    cy.get("[name='notes']").type("some notes");
    cy.get("[type='submit']").click();
  });
  it("creates a multi-interval slot", () => {
    cy.visit("/prenotazioni");
    cy.get("[type='checkbox']").click();
    cy.get("[data-testid='new-slot-button']").first().click();
    cy.get("[value='ice']").check();
    cy.get("[value='competitive']").check();

    cy.get("[data-testid='add-interval']").click();

    cy.get("[type='text']").eq(2).clear().type("09:00");
    cy.get("[type='text']").eq(3).clear().type("10:30");
    cy.get("[data-testid='add-interval']").click();
    cy.get("[name='notes']").type("some notes");
    cy.get("[type='text']").eq(2).clear().type("11:00");
    cy.get("[type='text']").eq(3).clear().type("12:30");
    cy.get("[type='submit']").click();
  });
});
