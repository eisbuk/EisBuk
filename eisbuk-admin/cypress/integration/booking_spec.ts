import { DateTime } from "luxon";
import i18n from "@/i18next/i18n";

import { Routes } from "@/enums/routes";
import {
  ActionButton,
  AdminAria,
  BookingCountdown,
  Prompt,
} from "@/enums/translations";

import { createDateTitle } from "@/components/atoms/DateNavigation/utils";

import { saul } from "@/__testData__/customers";

describe("Booking flow", () => {
  describe("Test for not-an-admin", () => {
    it("doesn't allow booking past the booking deadline for a given month", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      const afterDueDate = testDateLuxon
        .minus({
          days: 5,
        })
        .plus({ hours: 1 });
      cy.setClock(afterDueDate.toMillis());
      cy.initAdminApp(false).then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );
      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month" as the default customer navigation position is "book_ice"
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval)).should(
        "have.attr",
        "disabled"
      );
    });

    it("allows booking if the booking deadline hasn't passed", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      // test booking the slot in regular circumstances (min 5 days before start of `testDate` month)
      const beforeDueDate = testDateLuxon.minus({
        days: 7,
      });
      cy.setClock(beforeDueDate.toMillis());
      cy.initAdminApp(false).then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );
      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month" as the default customer navigation position is "book_ice"
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval)).should(
        "not.have.attr",
        "disabled"
      );
    });

    it("shows a first-deadline notification and a countdown if the booking deadline is near and removes it if at least one slot gets booked", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      // test booking the slot in regular circumstances (min 5 days before start of `testDate` month)
      const beforeDueDate = testDateLuxon.minus({
        days: 7,
      });
      cy.setClock(beforeDueDate.toMillis());
      cy.initAdminApp(false).then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );
      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      const countdownRegex = /[0-9][0-9]:[0-9][0-9]:[0-9][0-9]:[0-9][0-9]/;
      cy.contains(countdownRegex);
      cy.contains(
        i18n.t(BookingCountdown.FirstDeadline, {
          month: testDateLuxon,
        }) as string
      );
      // the "Finalize" button should not be shown in first deadline countdown
      cy.get("button")
        .contains(i18n.t(ActionButton.FinalizeBookings) as string)
        .should("not.exist");
      cy.pause();
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval))
        .eq(0)
        .click({ force: true });

      cy.root().contains(countdownRegex).should("not.exist");
    });

    it.only("shows a second-deadline notification and a countdown if in extendedDate period", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      // we're using test date as our `Date.now()`
      // since our test customer (saul) loaded from `saul_with_extended_date.json`
      // has an extended date (second deadline) until "2022-01-05", rendering our
      // `testDate` between first and second deadline
      cy.setClock(testDateLuxon.toMillis());
      cy.initAdminApp(false).then((organization) =>
        cy.updateFirestore(organization, [
          "saul_with_extended_date.json",
          "slots.json",
        ])
      );
      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // go back one month (since the bookings open for next month by default)
      cy.getAttrWith("aria-label", i18n.t(AdminAria.SeePastDates)).click();
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));
      // check countdown string
      const extendedDate = DateTime.fromISO("2022-01-05").endOf("day");
      const { days, hours, minutes, seconds } = extendedDate.diff(
        testDateLuxon,
        ["days", "hours", "minutes", "seconds"]
      );
      // create countdown string (from test data) in "dd:hh:mm:ss" format
      const countdownString = [days, hours, minutes, seconds]
        .map((t) => `0${Math.floor(t)}`.slice(-2))
        .join(":");
      // the UI should contain the countdown to the second deadline
      cy.contains(countdownString);
      cy.contains(
        i18n.t(BookingCountdown.SecondDeadline, {
          month: testDateLuxon,
        }) as string
      );
      // even after booking a slot for a month, the second-deadline notification
      // should stay there (until the deadline has passed, or bookings have been `finalized`)
      const countdownRegex = /[0-9][0-9]:[0-9][0-9]:[0-9][0-9]:[0-9][0-9]/;
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval))
        .eq(0)
        .click({ force: true });
      cy.contains(countdownRegex);
      cy.pause();
      // additionally, we want to make sure that the second date countdown is there
      // even if we're looking up the slots in the future (the not-yet-expired bookings)
      cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();
      cy.contains(countdownRegex);
      // test button to freeze slots
      cy.get("button")
        .contains(i18n.t(ActionButton.FinalizeBookings) as string)
        .click();
      cy.contains(i18n.t(Prompt.FinalizeBookingsTitle) as string);
      cy.contains(
        i18n.t(Prompt.ConfirmFinalizeBookings, {
          month: testDateLuxon,
        }) as string
      );
      cy.get("button").contains(/yes/i).click({ force: true });
      // after the bookings are finalized, the countdown should get removed
      cy.root().contains(countdownRegex).should("not.exist");
    });
  });

  describe("Test for admin", () => {
    it("always allows booking, if admin", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      // test booking the slot in regular circumstances (min 5 days before start of `testDate` month)
      const afterDueDate = testDateLuxon
        .minus({
          days: 5,
        })
        .plus({ hours: 1 });
      cy.setClock(afterDueDate.toMillis());
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );
      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month" as the default customer navigation position is "book_ice"
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval)).should(
        "not.have.attr",
        "disabled"
      );
    });

    it("doesn't show booking countdown for admin", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      const beforeDueDate = testDateLuxon.minus({
        days: 7,
      });
      cy.setClock(beforeDueDate.toMillis());
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );
      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));
      const countdownRegex = /[0-9][0-9]:[0-9][0-9]:[0-9][0-9]:[0-9][0-9]/;
      cy.root().contains(countdownRegex).should("not.exist");
    });
  });
});
