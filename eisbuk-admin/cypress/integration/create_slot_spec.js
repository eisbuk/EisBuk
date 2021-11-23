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
    "identitytoolkit.googleapis.com/v1/accounts:signUp*"
  ).as("signupNewUser");
  cy.intercept(
    "POST",
    "identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*"
  ).as("signinOldUser");

  cy.contains("Create admin test users").click();

  // We wait for @createOrganization to complete
  cy.wait("@createOrganization").then(() => {
    // and then for @signupNewUser (every time)
    cy.log("Organization created");
    cy.wait("@signupNewUser").then(({ response }) => {
      // If this response is 400 it means we also need to wait on @signinOldUser
      if (response.statusCode === 400) {
        cy.wait("@signinOldUser").then(() => cy.log("User signed in"));
      } else {
        cy.log("User created");
      }
    });
  });
});

describe("Create slot", () => {
  beforeEach(() => {
    cy.visit("/prenotazioni");
    
    cy.get("div[aria-label='Page Navigation']").as("Page-Nav");
      
    cy.get("@Page-Nav").within(() => {
      cy.get("a[href='/prenotazioni']")
        .should("have.attr", "aria-disabled", "true")
        .and("have.attr", "aria-current", "page");

      cy.get("a[href='/']")
        .should("have.attr", "aria-disabled", "false")
        .and("have.attr", "aria-current", "false");

      cy.get("a[href='/atleti']")
        .should("have.attr", "aria-disabled", "false")
        .and("have.attr", "aria-current", "false");
    })

    cy.get("[aria-label='Toggle visibility of slot operation buttons.']").as("Slot-Operation-Toggle");
  })

  it("fills in slot form and submits it", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.get("[aria-label='Create new slots button']").eq(0).click()

    cy.get("[aria-label='ice']").click()
    cy.get("[aria-label='competitive']").click();

    cy.get("[aria-label='intervals[0] start time']").clear().type("09:00");
    cy.get("[aria-label='intervals[0] end time']").clear().type("10:30");

    cy.get("[aria-label='Additional slot notes']").type("some notes");
    cy.get("[aria-label='Confirm slot creation']").click();

    // check for created slot or snackbar

    // tst for disabled checkbox
  });

  it("creates an off-ice slot", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.get("[aria-label='Create new slots button']").eq(0).click()

    cy.get("[aria-label='off-ice-dancing']").click();

    cy.get("[aria-label='Slot Category']")
      .should("have.attr", "aria-disabled", "true");

    cy.get("[aria-label='intervals[0] start time']").clear().type("09:00");
    cy.get("[aria-label='intervals[0] end time']").clear().type("10:30");
    cy.get("[aria-label='Additional slot notes']").type("some notes");
    cy.get("[aria-label='Confirm slot creation']").click();
  });
  
  it("creates a multi-interval slot", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.get("[aria-label='Create new slots button']").eq(0).click()

    cy.get("[aria-label='ice']").click();
    cy.get("[aria-label='competitive']").click();

    cy.get("[aria-label='intervals[0] start time']").clear().type("09:00");
    cy.get("[aria-label='intervals[0] end time']").clear().type("10:30");

    cy.get("[aria-label='Add Interval']").click();

    cy.get("[aria-label='intervals[1] start time']").clear().type("09:00");
    cy.get("[aria-label='intervals[1] end time']").clear().type("10:30");

    cy.get("[aria-label='Additional slot notes']").type("some notes");
    cy.get("[aria-label='Confirm slot creation']").click();
  });
});
