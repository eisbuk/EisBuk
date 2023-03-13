import { DateTime, DateTimeUnit } from "luxon";

import { Customer, CustomerBookings, SlotInterface } from "@eisbuk/shared";
import i18n, {
  ActionButton,
  BookingAria,
  createDateTitle,
  NotificationMessage,
} from "@eisbuk/translations";

import {
  PrivateRoutes,
  Routes,
  __dayWithBookedSlots__,
  __dayWithSlots__,
} from "../temp";

import { slots } from "../__testData__/slots.json";
import { customers } from "../__testData__/customers.json";
import { customers as saulWithExtendedDate } from "../__testData__/saul_with_extended_date.json";
import { bookings } from "../__testData__/bookings.json";
import { attendance } from "../__testData__/attendance.json";

// extract gus from test data .json
const gus = customers.gus as Customer;

const saul = saulWithExtendedDate.saul as Customer;

const testDateLuxon = DateTime.fromISO("2022-01-04");

const openCalendar = (
  date: DateTime = testDateLuxon,
  jump: DateTimeUnit = "week"
) => cy.contains(i18n.t(createDateTitle(date, jump)) as string).click();

/** @TEMP skip as it uses the old customer_area page */

xdescribe("Date Switcher", () => {
  describe("Customer calendar view", () => {
    beforeEach(() => {
      cy.setClock(testDateLuxon.toMillis());
      cy.initAdminApp()
        .then((organization) =>
          cy.updateSlots(organization, slots as Record<string, SlotInterface>)
        )
        .then((organization) =>
          cy.updateCustomers(
            organization,
            customers as Record<string, Customer>
          )
        )
        .then((organization) =>
          cy.updateBookings(
            organization,
            bookings as Record<string, CustomerBookings>
          )
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
          cy.updateSlots(organization, slots as Record<string, SlotInterface>)
        )
        .then((organization) => cy.updateAttendance(organization, attendance))
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

describe("Download ics file to Add To Calendar", () => {
  it("checks email was sent and calendar collection was updated successfully", () => {
    cy.setClock(testDateLuxon.toMillis());

    cy.initAdminApp()
      .then((organization) =>
        cy.updateSlots(organization, slots as Record<string, SlotInterface>)
      )
      .then((organization) =>
        cy.updateCustomers(
          organization,
          saulWithExtendedDate as Record<string, Customer>
        )
      );
    cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
    cy.getAttrWith("aria-label", i18n.t(BookingAria.BookButton))
      .first()
      .click({ force: true });

    cy.contains(i18n.t(ActionButton.AddToCalendar).toString()).click();
    cy.getAttrWith("type", "email").type(saul.email || "valid@email.com");
    cy.getAttrWith("type", "submit").click();

    cy.contains(i18n.t(NotificationMessage.SlotsAddedToCalendar) as string);
    cy.contains(i18n.t(NotificationMessage.EmailSent) as string);
  });
});
