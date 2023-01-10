import i18n, { AdminAria } from "@eisbuk/translations";
import { DateTime } from "luxon";
import { PrivateRoutes } from "../temp";

import { customers } from "../__testData__/customers.json";

describe("AddAttendedCustomersDialog", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    cy.initAdminApp()
      .then((organization) =>
        // Load test data into firestore
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      )
      .then(() => cy.signIn())
      .then(() =>
        // Our test slot's date is "2022-01-01" so we want to set the clock to that date to open it immediately
        cy.setClock(DateTime.fromISO("2022-01-01").toMillis())
      )
      .then(() => cy.visit(PrivateRoutes.Root));
  });

  it("Adds attended athletes from eligible (by slot category) althetes from the list", () => {
    cy.getAttrWith(
      "aria-label",
      i18n.t(AdminAria.AddAttendedCustomers) as string
    ).click();
    cy.getAttrWith("aria-label", "add-athletes-dialog");

    // Add customer
    cy.contains("Saul").click();

    // Saul should be added to the attendance card as having attended
    cy.getAttrWith("aria-label", "attendance-card").contains("Saul");
    // Saul should be removed from the add-athletes-dialog (as it's already marked as attended)
    cy.getAttrWith("aria-label", "add-athletes-dialog")
      .contains("Saul")
      .should("not.exist");
  });

  it("closes the add-athletes-dialog when there are no more customers to show", () => {
    cy.getAttrWith(
      "aria-label",
      i18n.t(AdminAria.AddAttendedCustomers) as string
    ).click();
    cy.getAttrWith("aria-label", "add-athletes-dialog");

    // Add all customers
    Object.values(customers).forEach(({ name }) => {
      cy.contains(name).click();
    });

    // All customers are added, add-athletes-dialog should automatically close
    cy.getAttrWith("aria-label", "add-athletes-dialog").should("not.exist");
  });
});
