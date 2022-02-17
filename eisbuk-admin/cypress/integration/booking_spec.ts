import { DateTime } from "luxon";
import i18n from "@/i18next/i18n";

import { CustomerRoute, Routes } from "@/enums/routes";
import {
  ActionButton,
  AdminAria,
  BookingCountdownMessage,
  NotificationMessage,
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
      const januaryDeadline = getBookingDeadline(testDateLuxon);
      const afterDueDate = januaryDeadline.plus({
        days: 1,
      });
      // set current time just after the deadline has passed
      cy.setClock(afterDueDate.toMillis());
      cy.initAdminApp(false).then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );

      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month" as the default customer navigation position is "book_ice"
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));

      // should show bookings locked message
      cy.contains(i18n.t(BookingCountdownMessage.BookingsLocked) as string);

      // should not allow slot bookings
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval)).should(
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
      cy.initAdminApp(false).then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );

      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month" as the default customer navigation position is "book_ice"
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));

      // should display countdown until january deadline
      cy.contains(
        getCountdownStringMatch({
          message: BookingCountdownMessage.FirstDeadline,
          date: januaryDeadline,
          // should count down two days (until deadline)
          days: "02",
          hours: "00",
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
    });

    it("allows booking if within extended date period", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      // we're using test date as our `Date.now()`
      // our test customer (saul) loaded from `saul_with_extended_date.json`
      // has an extended date (second deadline) until "2022-01-05"
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

      // should display countdown until `extendedDate` (and second countdown message)
      const extendedDate = DateTime.fromISO("2022-01-05").endOf("day");
      cy.contains(
        getCountdownStringMatch({
          message: BookingCountdownMessage.SecondDeadline,
          date: extendedDate,
          // our initial time -> "2022-01-01 00:00"
          // extended date -> "2022-01-05 23:59"
          // difference 4 days, 23 hours (plus some seconds)
          days: "04",
          hours: "23",
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
      cy.get("button").contains(/yes/i).click({ force: true });

      // should lock bookings after "finalize" button click
      cy.contains(i18n.t(BookingCountdownMessage.BookingsLocked) as string);
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval)).should(
        "have.attr",
        "disabled"
      );
    });

    it.only("disables only the locked bookings if locked/non-locked month overlap shown", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      const januaryDeadline = getBookingDeadline(testDateLuxon);
      // January 2022 bookings should be unlocked, while the December 2021 bookings should be closed
      // according to this date
      const beforeDueDate = januaryDeadline.minus({
        days: 2,
      });
      cy.setClock(beforeDueDate.toMillis());
      cy.initAdminApp(false).then((organization) =>
        cy.updateFirestore(organization, [
          "customers.json",
          // load off-ice slots, belonging to the end-of-december start-of-january week
          "off-ice-slots.json",
        ])
      );

      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // switch to book off-ice
      cy.getAttrWith("aria-label", CustomerRoute.BookOffIce).click();
      // move back (from the end of January, to first week in January)
      cy.getAttrWith("aria-label", i18n.t(AdminAria.SeePastDates))
        .click()
        .click()
        .click()
        .click();
      cy.contains(createDateTitle(testDateLuxon, "week", i18n.t));

      // if showing slots belonging to different months (as is the case in this test)
      // should display countdown with respect to later month
      cy.contains(
        getCountdownStringMatch({
          message: BookingCountdownMessage.FirstDeadline,
          date: januaryDeadline,
          // should count down two days (until deadline)
          days: "02",
          hours: "00",
        })
      );

      // should disable the booking first slot (blonging to December 2021)
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval))
        .eq(0)
        .should("have.attr", "disabled");
      // should allow booking of second slot (belonging to January 2022)
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval))
        .eq(1)
        .click({ force: true });
      cy.contains(i18n.t(NotificationMessage.BookingSuccess) as string);
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

      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month" as the default customer navigation position is "book_ice"
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

      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month" as the default customer navigation position is "book_ice"
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));

      // should not display countdown message
      cy.contains(
        // as tested above
        // if not admin, this countdown string would be shown
        getCountdownStringMatch({
          message: BookingCountdownMessage.FirstDeadline,
          days: "02",
          hours: "00",
          date: januaryDeadline,
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
}: {
  message: BookingCountdownMessage;
  date: DateTime;
  days: string;
  hours: string;
}) => {
  const rawString = i18n.t(message, {
    date,
    days,
    hours,
  }) as string;

  return rawString.replace(/<\/?strong>/g, "");
};
