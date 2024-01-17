import { DateTime } from "luxon";

import i18n, { AdminAria } from "@eisbuk/translations";
import { Customer, SlotInterface } from "@eisbuk/shared";
import { Routes } from "@eisbuk/shared/ui";

import { customers } from "../__testData__/customers.json";
import * as testSlots from "__testData__/slots";

const { competitive, courseMinors } = testSlots as Record<
  string,
  Record<string, SlotInterface>
>;

const slots = {
  // Morticia is 'competitive'
  ...competitive,
  // Wednesday and Pugsley are 'course-minors'
  ...courseMinors,
} as Record<string, SlotInterface>;

const { morticia, wednesday, pugsley } = customers;

describe("Management of multiple athletes with single account", () => {
  // We're signing up/in as Morticia as her email is used to manege all three accounts
  const { email, password } = morticia;

  beforeEach(() =>
    cy
      .setClock(DateTime.fromISO("2021-02-01").toMillis())
      .initAdminApp()
      .then((organization) =>
        Promise.all([
          cy.updateCustomers(
            organization,
            customers as Record<string, Customer>
          ),
          cy.updateSlots(organization, slots),
        ])
      )
      // We'll need Morticia to be signed in for all of the tests
      .then(() => cy.signUp(email, password))
  );

  it("naviagates between athletes managed by the given auth account", () => {
    // Start by visiting the customer area page for Morticia
    // TODO: In the future, we'll want to use the account selection page
    cy.visit([Routes.CustomerArea, morticia.secretKey].join("/"));

    // Navigate to March 2021
    cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();

    cy.getSlotsDayContainer("2021-03-01").matchBookingsDay(competitive);

    // Open the account selection dropdown
    cy.contains(`${morticia.name} ${morticia.surname}`).click();

    // Check that the remaining two athletes are listed
    cy.contains(`${wednesday.name} ${wednesday.surname}`);
    cy.contains(`${pugsley.name} ${pugsley.surname}`);

    // Navigate to Wednesday's bookings
    cy.contains(`${wednesday.name} ${wednesday.surname}`).click();

    // Displays slots for Wednesday's (and Pugsley's) category (course-minors)
    cy.getSlotsDayContainer("2021-03-01").matchBookingsDay(courseMinors);

    // Navigate to Pugsley's bookings
    cy.contains(`${wednesday.name} ${wednesday.surname}`).click(); // Customer avatar menu
    cy.contains(`${pugsley.name} ${pugsley.surname}`).click(); // Navigation

    cy.getSlotsDayContainer("2021-03-01").matchBookingsDay(courseMinors);

    // Navigate back to Morticia (for good measure)
    cy.contains(`${pugsley.name} ${pugsley.surname}`).click(); // Customer avatar menu
    cy.contains(`${morticia.name} ${morticia.surname}`).click(); // Navigation

    cy.getSlotsDayContainer("2021-03-01").matchBookingsDay(competitive);
  });

  // This tests entirely different slots per athlete as test data is set in such a way
  // that there's no overlap between slots of different categories (and athletes in question are of different categories).
  it("books for selected athlete (athletes with different categories)", () => {
    // Start by visiting the customer area page for Morticia
    // TODO: In the future, we'll want to use the account selection page
    cy.visit([Routes.CustomerArea, morticia.secretKey].join("/"));

    // Navigate to March 2021
    cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();

    // Book two intervals (for Morticia)
    cy.getSlotsDayContainer("2021-03-01").getBookingsCard("08:00-09:00").book();
    cy.getSlotsDayContainer("2021-03-01").getBookingsCard("14:00-16:00").book();

    cy.getSlotsDayContainer("2021-03-01").matchBookingsDay(competitive, [
      "08:00-09:00",
      "14:00-16:00",
    ]);

    // Navigate to Wednesday's profile (no slots should be booked)
    cy.contains(`${morticia.name} ${morticia.surname}`).click(); // Customer avatar menu
    cy.contains(`${wednesday.name} ${wednesday.surname}`).click(); // Navigation

    cy.getSlotsDayContainer("2021-03-01").matchBookingsDay(courseMinors);

    // Book an interval (for Wednesday)
    cy.getSlotsDayContainer("2021-03-01").getBookingsCard("10:30-11:30").book();

    cy.getSlotsDayContainer("2021-03-01").matchBookingsDay(courseMinors, [
      "10:30-11:30",
    ]);

    // Check for Wednesday's calendar bookings
    cy.contains("Calendar").click();
    cy.matchCalendarMonth([{ date: "2021-03-01", interval: "10:30-11:30" }]);

    // Go back to Morticia's profile
    cy.contains(`${wednesday.name} ${wednesday.surname}`).click(); // Customer avatar menu
    cy.contains(`${morticia.name} ${morticia.surname}`).click(); // Navigation

    // Check Morticia's calendar
    cy.matchCalendarMonth([
      { date: "2021-03-01", interval: "08:00-09:00" },
      { date: "2021-03-01", interval: "14:00-16:00" },
    ]);
  });

  // This tests for overlapping slots (customers are of same category) but ensures that the booking state changes between customer views.
  it("books for selected athlete (athletes with different categories)", () => {
    // Start by visiting the customer area page for Morticia
    // TODO: In the future, we'll want to use the account selection page
    cy.visit([Routes.CustomerArea, morticia.secretKey].join("/"));

    // Navigate to March 2021
    cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();

    // Navigate to Wednesday's profile and book two slots
    cy.contains(`${morticia.name} ${morticia.surname}`).click(); // Customer avatar menu
    cy.contains(`${wednesday.name} ${wednesday.surname}`).click(); // Navigation

    // Book an interval (for Wednesday)
    cy.getSlotsDayContainer("2021-03-01").getBookingsCard("10:30-11:30").book();
    cy.getSlotsDayContainer("2021-03-01").getBookingsCard("18:00-20:00").book();

    cy.getSlotsDayContainer("2021-03-01").matchBookingsDay(courseMinors, [
      "10:30-11:30",
      "18:00-20:00",
    ]);

    // Navigate to Pugsley's profile (should display the same intervals, but none should be booked)
    cy.contains(`${wednesday.name} ${wednesday.surname}`).click(); // Customer avatar menu
    cy.contains(`${pugsley.name} ${pugsley.surname}`).click(); // Navigation

    cy.getSlotsDayContainer("2021-03-01").matchBookingsDay(courseMinors);

    // Book a slot for Pugsley
    cy.getSlotsDayContainer("2021-03-01").getBookingsCard("10:00-12:00").book();

    cy.getSlotsDayContainer("2021-03-01").matchBookingsDay(courseMinors, [
      "10:00-12:00",
    ]);

    // Check for Pugsley's calendar bookings
    cy.contains("Calendar").click();
    cy.matchCalendarMonth([{ date: "2021-03-01", interval: "10:00-12:00" }]);

    // Go back to Wednesday's profile
    cy.contains(`${pugsley.name} ${pugsley.surname}`).click(); // Customer avatar menu
    cy.contains(`${wednesday.name} ${wednesday.surname}`).click(); // Navigation

    // Check for Wednesday's calendar bookings
    cy.matchCalendarMonth([
      { date: "2021-03-01", interval: "10:30-11:30" },
      { date: "2021-03-01", interval: "18:00-20:00" },
    ]);
  });
});
