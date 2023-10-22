import { DateTime } from "luxon";

import { Customer, SlotInterface } from "@eisbuk/shared";
import { PrivateRoutes } from "@eisbuk/shared/ui";
import i18n, { SlotsAria } from "@eisbuk/translations";

import { slots } from "../__testData__/slots.json";
import { attendance } from "../__testData__/attendance.json";
import { customers } from "../__testData__/customers.json";

const testDateLuxon = DateTime.fromISO("2022-01-01");

describe("Edit slots modal", () => {
  beforeEach(() => {
    // App setup
    cy.setClock(testDateLuxon.toMillis());
    cy.initAdminApp()
      .then((organization) =>
        cy.updateCustomers(organization, customers as Record<string, Customer>)
      )
      .then((organization) =>
        cy.updateSlots(organization, slots as Record<string, SlotInterface>)
      )
      .then((organization) => cy.updateAttendance(organization, attendance))
      .then(() => cy.signIn())
      // Load the view before making any assertions
      .then(() => cy.visit(PrivateRoutes.Slots))
      // Make sure to wait enough time for the slots to be fetched:
      // The word "competitive" will appear only when slots are displayed.
      // For some reason the wait time in the CI is significantly longer then locally
      // @TODO check if this is still necessary after we make the e2e tests a bit leaner
      .then(() => cy.contains("competitive", { timeout: 20000 }));

    cy.getAttrWith("aria-label", i18n.t(SlotsAria.EnableEdit)).click();
  });

  it("Checks for disabled deleting or updating bookedIntervals", () => {
    // click the edit button of booked slot (1/1)
    cy.getByTestId("edit-slot-button").eq(1).click();

    // second interval is booked
    cy.getByTestId("delete-interval-button").eq(1).should("be.disabled");

    // Check if decrement and increment buttons are disabled
    cy.getByTestId("decrement-button").eq(2).should("be.disabled");
    cy.getByTestId("increment-button").eq(2).should("be.disabled");
    cy.getByTestId("decrement-button").eq(3).should("be.disabled");
    cy.getByTestId("increment-button").eq(3).should("be.disabled");

    // Try to click on the disabled delete button and check no interval has been deleted
    cy.getByTestId("delete-interval-button").eq(1).click({ force: true });
    cy.getByTestId("delete-interval-button").should("have.length", 3);
    // Check for the hover text and see if it contains the list of names
    cy.getByTestId("hover-text")
      .invoke("text")
      .should("include", `${customers.gus.name} ${customers.gus.surname}`);
  });
});
