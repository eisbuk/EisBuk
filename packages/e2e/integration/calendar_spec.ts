import { DateTime, DateTimeUnit } from "luxon";

import { Customer } from "@eisbuk/shared";
import i18n, { createDateTitle, ActionButton } from "@eisbuk/translations";

import {
  PrivateRoutes,
  Routes,
  __dayWithBookedSlots__,
  __dayWithSlots__,
} from "../temp";

import path from "path";

import testCustomers from "../__testData__/customers.json";
import extendedDateCustomers from "../__testData__/saul_with_extended_date.json";

// extract gus from test data .json
const gus = testCustomers.customers.gus as Customer;
const saul = extendedDateCustomers.customers.saul as Customer;

const testDateLuxon = DateTime.fromISO("2022-01-04");

const openCalendar = (
  date: DateTime = testDateLuxon,
  jump: DateTimeUnit = "week"
) => cy.contains(i18n.t(createDateTitle(date, jump)) as string).click();

xdescribe("Date Switcher", () => {
  describe("Customer calendar view", () => {
    beforeEach(() => {
      cy.setClock(testDateLuxon.toMillis());
      cy.initAdminApp()
        .then((organization) =>
          cy.updateFirestore(organization, ["slots.json", "bookings.json"])
        )
        .then(() => cy.signIn());
    });

    it("shows appropriate badges on clandar days in customer calendar view", () => {
      cy.visit([Routes.CustomerArea, gus.secretKey, "calendar"].join("/"));

      openCalendar();

      // should show a has-booked-slots badge on days with slots
      // the customer has booked
      cy.getAttrWith("data-testid", __dayWithSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-02").toFormat("DD"));

      // should show a has-slots badge on days with existing slots
      // but no bookings for a day
      cy.getAttrWith("data-testid", __dayWithBookedSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-01").toFormat("DD"));
    });
  });

  describe("Attendance view", () => {
    beforeEach(() => {
      cy.setClock(testDateLuxon.toMillis());
      cy.initAdminApp()
        .then((organization) =>
          cy.updateFirestore(organization, ["attendance.json"])
        )
        .then(() => cy.signIn());
    });

    it("shows appropriate badges on clandar days in attendance view", () => {
      cy.visit(PrivateRoutes.Root);

      openCalendar(testDateLuxon, "day");

      cy.getAttrWith("data-testid", __dayWithBookedSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-01").toFormat("DD"));

      cy.getAttrWith("data-testid", __dayWithSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-02").toFormat("DD"));
    });
  });
});
describe("Add To Calendar", () => {
  describe("ics file", () => {
    const downloadsFolder = Cypress.config("downloadsFolder");
    beforeEach(() => {
      cy.setClock(testDateLuxon.toMillis());

      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, [
          "saul_with_extended_date.json",
          "slots.json",
        ])
      );
      cy.task("deleteFolder", downloadsFolder);
    });
    it("downloads ics file", () => {
      cy.visit([Routes.CustomerArea, saul.secretKey, "book_ice"].join("/"));
      cy.getAttrWith("aria-label", "See past dates").click();
      cy.getAttrWith("aria-label", "Book").first().click();

      cy.contains(i18n.t(ActionButton.FinalizeBookings).toString()).click();
      cy.contains("Yes").click();

      cy.contains(i18n.t(ActionButton.AddToCalendar).toString()).click();
      const filename = path.join(downloadsFolder, "Booked_Slots.ics");
      cy.readFile(filename);
    });
  });
});
