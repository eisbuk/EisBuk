import { DateTime } from "luxon";

import { Customer, SlotInterface } from "@eisbuk/shared";
import i18n, {
  ActionButton,
  AdminAria,
  BookingCountdownMessage,
  createDateTitle,
  NotificationMessage,
} from "@eisbuk/translations";

import { Routes, __notificationToastId__ } from "../temp";

import { customers } from "../__testData__/customers.json";
import { slots } from "../__testData__/slots.json";

// extract saul from test data .json
const saul = customers.saul as Customer;

describe("Booking flow", () => {
  beforeEach(() => {
    cy.initAdminApp()
      .then((organization) =>
        cy.updateCustomers(organization, customers as Record<string, Customer>)
      )
      .then((organization) =>
        cy.updateSlots(organization, slots as Record<string, SlotInterface>)
      );
    cy.signIn();
  });

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

    cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
    cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();

    cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));

    // the bookings locked message is not displayed for admin
    cy.contains(
      i18n.t(BookingCountdownMessage.BookingsLocked, {
        month: testDateLuxon,
      }) as string
    ).should("not.exist");

    // as tested above,
    // if not admin, this wouldn't be allowed
    cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval))
      .eq(0)
      // We need to check if the button is disabled, before clicking
      // as it will sometimes be disabled for a split second, until the admin
      // state is loaded
      .should("not.be.disabled")
      .click({
        force: true,
      });
    // Check that the booking was successful
    cy.getByTestId(__notificationToastId__).contains(
      i18n.t(NotificationMessage.BookingSuccess, {
        date: DateTime.fromISO("2022-01-01"),
        interval: "09:00-11:00",
      }) as string
    );
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
