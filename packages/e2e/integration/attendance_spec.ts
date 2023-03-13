import i18n, { AttendanceAria } from "@eisbuk/translations";
import { DateTime } from "luxon";

import { Customer, SlotInterface } from "@eisbuk/shared";

import { PrivateRoutes } from "../temp";

import { customers } from "../__testData__/customers.json";
import { attendance } from "../__testData__/attendance.json";
import { slots } from "../__testData__/slots.json";

const gus = customers["gus"];

describe("AddAttendedCustomersDialog", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    cy.initAdminApp()
      // Save organziation to cypress context (making it available to the test functions)
      .then((organization) => cy.wrap(organization).as("organization"))

      // Load test data into firestore
      .then((organization) =>
        cy.updateCustomers(organization, customers as Record<string, Customer>)
      )
      .then((organization) =>
        cy.updateSlots(organization, slots as Record<string, SlotInterface>)
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
      i18n.t(AttendanceAria.AddAttendedCustomers) as string
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
      i18n.t(AttendanceAria.AddAttendedCustomers) as string
    ).click();
    cy.getAttrWith("aria-label", "add-athletes-dialog");

    // Add all customers
    Object.values(customers).forEach(({ name }) => {
      cy.contains(name).click();
    });

    // All customers are added, add-athletes-dialog should automatically close
    cy.getAttrWith("aria-label", "add-athletes-dialog").should("not.exist");
  });

  it("marks customer as present/absent using the mark attendance button", () => {
    // Load the attendance setup
    cy.get<string>("@organization").then((organization) =>
      cy.updateAttendance(organization, attendance)
    );

    // Mark absent
    cy.contains(gus.name)
      .getAttrWith("aria-label", i18n.t(AttendanceAria.MarkAbsent))
      .click();

    // Mark present
    cy.contains(gus.name)
      .getAttrWith("aria-label", i18n.t(AttendanceAria.MarkPresent))
      .click();

    // We should be back at the initial state: Gus is marked as present.
    // We can check this by checking that the mark absent button is visible.
    //
    // There's a bit of asymetry here:
    // The button is used to mark customer as absent, but it displays "👍" icon, and vice versa.
    // The reason for this is that the button is used as a toggle, so it displays the current state, not the action.
    cy.contains(gus.name).contains("👍");
  });

  it("changes the attended interval using the interval picker element", () => {
    // Load the attendance setup
    cy.get<string>("@organization").then((organization) =>
      cy.updateAttendance(organization, attendance)
    );

    const intervals = ["09:00-11:00", "09:00-10:00", "10:00-11:00"];

    // The initial interval (booked by gus) is the last interval of the slot
    cy.get("*").contains(gus.name).contains(intervals[2]);
    // With the last slot attended, the next button should be disabled
    cy.getAttrWith("aria-label", i18n.t(AttendanceAria.NextInterval)).should(
      "be.disabled"
    );

    // Check interval picker functionality
    cy.getAttrWith(
      "aria-label",
      i18n.t(AttendanceAria.PreviousInterval)
    ).click();
    cy.contains(gus.name).contains(intervals[1]);

    cy.getAttrWith(
      "aria-label",
      i18n.t(AttendanceAria.PreviousInterval)
    ).click();
    cy.contains(gus.name).contains(intervals[0]);

    // On the first interval, the previous button should be disabled
    cy.getAttrWith(
      "aria-label",
      i18n.t(AttendanceAria.PreviousInterval)
    ).should("be.disabled");

    // Revert back to the last interval
    cy.getAttrWith("aria-label", i18n.t(AttendanceAria.NextInterval)).click();
    cy.contains(gus.name).contains(intervals[1]);

    cy.getAttrWith("aria-label", i18n.t(AttendanceAria.NextInterval)).click();
    cy.contains(gus.name).contains(intervals[2]);
  });
});
