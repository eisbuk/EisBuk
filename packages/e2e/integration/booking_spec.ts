import { DateTime } from "luxon";

import { Customer } from "@eisbuk/shared";
import i18n, {
  ActionButton,
  AdminAria,
  BookingCountdownMessage,
  NotificationMessage,
  Prompt,
  createDateTitle,
  BookingAria,
  CustomerNavigationLabel,
} from "@eisbuk/translations";

import { Routes } from "../temp";

import testCustomers from "../__testData__/customers.json";

// extract saul from test data .json
const saul = testCustomers.customers.saul as Customer;

describe("Booking flow", () => {
  describe("Test for not-an-admin", () => {
    it("doesn't allow booking past the booking deadline for a given month", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      const januaryDeadline = getBookingDeadline(testDateLuxon);
      const afterDueDate = januaryDeadline.plus({
        days: 1,
      });
      // set current time just after the deadline has passed
      cy.setClock(afterDueDate.toMillis());
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );

      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month"
      cy.contains(createDateTitle(afterDueDate, "month", i18n.t));

      // should show bookings locked message
      cy.contains(
        i18n.t(BookingCountdownMessage.BookingsLocked, {
          month: afterDueDate,
        }) as string
      );

      // should not allow slot bookings
      cy.getAttrWith("aria-label", i18n.t(BookingAria.BookButton)).should(
        "have.attr",
        "disabled"
      );
    });

    it("allows booking if the booking deadline hasn't passed", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      const januaryDeadline = getBookingDeadline(testDateLuxon);
      // test booking the slot in regular circumstances (2 days before the deadline)
      const beforeDueDate = januaryDeadline.minus({
        days: 2,
      });
      cy.setClock(beforeDueDate.toMillis());
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );

      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();
      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month"
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));

      // should display countdown until january deadline
      cy.contains(
        getCountdownStringMatch({
          message: BookingCountdownMessage.FirstDeadline,
          date: januaryDeadline,
          // should count down two days (until deadline)
          days: 2,
          hours: 0,
          month: testDateLuxon,
        })
      );

      // the "Finalize" button should not be shown in first deadline countdown
      cy.get("button")
        .contains(i18n.t(ActionButton.FinalizeBookings) as string)
        .should("not.exist");

      // should be able to book slot
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval))
        .eq(0)
        .click({
          // force true to avoid detatched error (happening because the button gets rerendered)
          force: true,
        });
      cy.contains(i18n.t(NotificationMessage.BookingSuccess) as string);
      // should change "book" button into "cancel" button
      cy.contains(i18n.t(ActionButton.Cancel) as string);
    });

    it("allows booking if within extended date period", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      // we're using test date as our `Date.now()`
      // our test customer (saul) loaded from `saul_with_extended_date.json`
      // has an extended date (second deadline) until "2022-01-05"
      cy.setClock(testDateLuxon.toMillis());
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, [
          "saul_with_extended_date.json",
          "slots.json",
        ])
      );

      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));

      // should display countdown until `extendedDate` (and second countdown message)
      const extendedDate = DateTime.fromISO("2022-01-05").endOf("day");

      cy.contains(
        getCountdownStringMatch({
          message: BookingCountdownMessage.SecondDeadline,
          date: extendedDate,
          // our initial time -> "2022-01-01 00:00"
          // extended date -> "2022-01-05 23:59"
          // difference 4 days, 23 hours (plus some seconds)
          days: 4,
          hours: 23,
          month: extendedDate,
        }) as string
      );

      // should be able to book interval
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval))
        .eq(0)
        .click({
          force: true,
        });
      cy.contains(i18n.t(NotificationMessage.BookingSuccess) as string);

      // should display confirmation dialog finalizing of the bookings
      cy.get("button")
        .contains(i18n.t(ActionButton.FinalizeBookings) as string)
        .click();
      cy.contains(i18n.t(Prompt.FinalizeBookingsTitle) as string);
      cy.contains(
        i18n.t(Prompt.ConfirmFinalizeBookings, {
          month: testDateLuxon,
        }) as string
      );
      // we're clicking on "Finalize" button inside the modal
      cy.getAttrWith("id", "modal")
        .find("button")
        .contains(i18n.t(ActionButton.FinalizeBookings) as string)
        .click({ force: true });

      // should lock bookings after "finalize" button click
      cy.contains(
        i18n.t(BookingCountdownMessage.BookingsLocked, {
          month: testDateLuxon,
        }) as string
      );
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval)).should(
        "have.attr",
        "disabled"
      );
    });
    it("disables cancelling booked slots that have passed the deadline in calendar view ", () => {
      const pastTestDate = "2021-12-01";
      const pastTestDateLuxon = DateTime.fromISO(pastTestDate);
      const futureTestDate = "2022-02-01";
      const futureTestDateLuxon = DateTime.fromISO(futureTestDate);

      cy.setClock(pastTestDateLuxon.toMillis());
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );

      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();

      // should be able to book interval
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval))
        .eq(0)
        .click({
          force: true,
        });
      cy.contains(i18n.t(NotificationMessage.BookingSuccess) as string);

      cy.contains(i18n.t(CustomerNavigationLabel.Calendar) as string).click();

      cy.setClock(futureTestDateLuxon.toMillis());

      // cancel button has the same aria-label as book
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval)).should(
        "have.attr",
        "disabled"
      );
    });
  });

  describe("Test for admin", () => {
    it("always allows booking, if admin", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      const januaryDeadline = getBookingDeadline(testDateLuxon);
      const afterDueDate = januaryDeadline.plus({
        days: 1,
      });
      // set current time just after the deadline has passed
      cy.setClock(afterDueDate.toMillis());
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );
      cy.signIn();

      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();

      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));

      // the bookings locked message is not displayed for admin
      cy.contains(
        i18n.t(BookingCountdownMessage.BookingsLocked) as string
      ).should("not.exist");

      // as tested above,
      // if not admin, this wouldn't be allowed
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval))
        .eq(0)
        .click({
          force: true,
        });
    });

    it("doesn't show booking countdown for admin", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      const januaryDeadline = getBookingDeadline(testDateLuxon);
      // regular circumstances (2 days before the deadline)
      const beforeDueDate = januaryDeadline.minus({
        days: 2,
      });
      cy.setClock(beforeDueDate.toMillis());
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );
      cy.signIn();

      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();

      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month"
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));

      // should not display countdown message
      cy.contains(
        // as tested above
        // if not admin, this countdown string would be shown
        getCountdownStringMatch({
          message: BookingCountdownMessage.FirstDeadline,
          days: 2,
          hours: 23,
          date: januaryDeadline,
          month: testDateLuxon,
        })
      ).should("not.exist");
    });
  });
});

/**
 * Calculates bookings deadline from provided date,
 * using (default) locking period of 5 days
 */
const getBookingDeadline = (date: DateTime) =>
  date.minus({ months: 1 }).endOf("month").minus({ days: 5 }).endOf("day");

/**
 * Get i18n string for countdown without html (`<strong>` tags)
 */
const getCountdownStringMatch = ({
  message,
  date,
  days,
  hours,
  month,
}: {
  message: BookingCountdownMessage;
  date: DateTime;
  days: number;
  hours: number;
  month: DateTime;
}) => {
  const rawString = i18n.t(message, {
    date,
    days,
    hours,
    month,
  }) as string;

  return rawString.replace(/<\/?strong>/g, "");
};
