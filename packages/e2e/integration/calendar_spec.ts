import { DateTime, DateTimeUnit } from "luxon";

import { Customer, CustomerBookings, SlotInterface } from "@eisbuk/shared";
import { PrivateRoutes, Routes } from "@eisbuk/shared/ui";
import i18n, {
  ActionButton,
  createDateTitle,
  NotificationMessage,
} from "@eisbuk/translations";

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

const __dayWithSlots__ = "day-with-slots";
const __dayWithBookedSlots__ = "day-with-booked-slots";

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
      cy.getByTestId(__dayWithSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-02").toFormat("DD"));

      // should show a has-slots badge on days with existing slots
      // but no bookings for a day
      cy.getByTestId(__dayWithBookedSlots__)
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

      cy.getByTestId(__dayWithBookedSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-01").toFormat("DD"));

      cy.getByTestId(__dayWithSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-02").toFormat("DD"));
    });
  });
});

/** @TODO un-skip this once add to calendar button is fixed */
xdescribe("Download ics file to Add To Calendar", () => {
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
    cy.getByTestId("book-button").first().click({ force: true });

    cy.getByTestId("add-to-calendar").click();
    cy.getAttrWith("type", "email").clearAndType(
      saul.email || "valid@email.com"
    );
    cy.clickButton(i18n.t(ActionButton.Send));

    cy.contains(i18n.t(NotificationMessage.SlotsAddedToCalendar) as string);
    cy.contains(i18n.t(NotificationMessage.EmailSent) as string);
  });
});
