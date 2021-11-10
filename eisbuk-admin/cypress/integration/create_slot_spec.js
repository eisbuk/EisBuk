import { v4 as uuidv4 } from "uuid";

beforeEach(() => {
  const id = uuidv4();
  cy.on("window:before:load", (win) => {
    win.localStorage.setItem("organization", id);
  });
  cy.visit(`/debug`);

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
describe("Create slot", () => {
  it("fills in slot form and submits it", () => {
    cy.visit("/prenotazioni");
    cy.get("[type='checkbox']").click();
    cy.get("[data-testid='new-slot-button']").first().click();
    cy.get("[value='ice']").check();

    // tst for disabled checkbox
  });
});
