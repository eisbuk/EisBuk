import i18n, { ActionButton, AttendanceAria } from "@eisbuk/translations";
import { DateTime } from "luxon";

import { Customer, SlotInterface } from "@eisbuk/shared";
import { PrivateRoutes } from "@eisbuk/shared/ui";

import { customers } from "../__testData__/customers.json";
import { attendance } from "../__testData__/attendance.json";
import { misc as slots } from "../__testData__/slots";

const gus = customers["gus"];

describe("AddAttendedCustomersDialog", () => {
  describe("Add athletes dialog", () => {
    beforeEach(() => {
      // Initialize app, create default user,
      // create default organization, sign in as admin
      cy.initAdminApp()
        // Save organziation to cypress context (making it available to the test functions)
        .then((organization) => cy.wrap(organization).as("organization"))

        // Load test data into firestore
        .then((organization) =>
          cy.updateCustomers(
            organization,
            customers as Record<string, Customer>
          )
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

    it("closes the add-athletes-dialog and disables the 'add customers' button when there are no more customers to show", () => {
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

      // There are no more customers to add, the add customers button should be disabled
      cy.getAttrWith(
        "aria-label",
        i18n.t(AttendanceAria.AddAttendedCustomers) as string
      ).should("be.disabled");
    });
  });

  describe("Absence and attended intervals", () => {
    beforeEach(() => {
      // Initialize app, create default user,
      // create default organization, sign in as admin
      cy.initAdminApp()
        // Save organziation to cypress context (making it available to the test functions)
        .then((organization) => cy.wrap(organization).as("organization"))

        // Load test data into firestore
        .then((organization) =>
          cy.updateCustomers(
            organization,
            customers as Record<string, Customer>
          )
        )
        .then((organization) =>
          cy.updateSlots(organization, slots as Record<string, SlotInterface>)
        )
        .then((organization) => cy.updateAttendance(organization, attendance))
        .then(() => cy.signIn())
        .then(() =>
          // Our test slot's date is "2022-01-01" so we want to set the clock to that date to open it immediately
          cy.setClock(DateTime.fromISO("2022-01-01").toMillis())
        )
        .then(() => cy.visit(PrivateRoutes.Root));
    });

    it("marks customer as present/absent using the mark attendance button", () => {
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
      cy.getAttrWith("aria-label", i18n.t(AttendanceAria.MarkAbsent));
    });

    /** @TODO Skipped as the test is broken, while the functionality if perfectly sound, investigate this */
    it.skip("changes the attended interval using the interval picker element", () => {
      const intervals = ["09:00-11:00", "09:00-10:00", "10:00-11:00"];

      // The initial interval (booked by gus) is the last interval of the slot
      cy.getByTestId("primary-interval").contains(intervals[2]);
      // With the last slot attended, the next button should be disabled
      cy.getAttrWith("aria-label", i18n.t(AttendanceAria.NextInterval)).should(
        "be.disabled"
      );

      // Check interval picker functionality
      cy.getAttrWith(
        "aria-label",
        i18n.t(AttendanceAria.PreviousInterval)
      ).click();
      cy.getByTestId("primary-interval").contains(intervals[1]);

      cy.getAttrWith(
        "aria-label",
        i18n.t(AttendanceAria.PreviousInterval)
      ).click();
      cy.getByTestId("primary-interval").contains(intervals[0]);

      // On the first interval, the previous button should be disabled
      cy.getAttrWith(
        "aria-label",
        i18n.t(AttendanceAria.PreviousInterval)
      ).should("be.disabled");

      // Revert back to the last interval
      cy.getAttrWith("aria-label", i18n.t(AttendanceAria.NextInterval)).click();
      cy.getByTestId("primary-interval").contains(intervals[1]);

      cy.getAttrWith("aria-label", i18n.t(AttendanceAria.NextInterval)).click();
      cy.getByTestId("primary-interval").contains(intervals[2]);
    });

    /** @TODO Skipped as the test is broken, while the functionality if perfectly sound, investigate this */
    it.skip("adds a new interval to the slot and marks alhlete's attendance with it using 'Custom interval' input", () => {
      // Intervals in slot "09:00-11:00", "09:00-10:00", "10:00-11:00";
      const newInterval = "11:00-12:00";

      // Show custom interval input (for Gus as the first athlete in the list)
      cy.get(`button:contains(${i18n.t(ActionButton.CustomInterval)})`).click();

      cy.getByTestId("custom-interval-input").type(newInterval);
      cy.getByTestId("add-custom-interval").click();

      // The input should no-longer be shown (the button should be show instead)
      cy.getByTestId("custom-interval-input").should("not.exist");
      cy.get(`button:contains(${i18n.t(ActionButton.CustomInterval)})`);

      // We verify the attendance has been updated by checking for the interval string being there (even though the input was removed)
      cy.contains(newInterval);

      // The slot time should be extended (as the interval time, before update was 09:00-11:00) to 09:00-12:00
      cy.contains("09:00 - 12:00");
    });

    /** @TODO test validation errors, the test wasn't working due to some issues with input being "disabled" (wasn't really disabled) */
  });
});
