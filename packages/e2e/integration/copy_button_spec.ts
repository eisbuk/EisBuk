import { DateTime } from "luxon";

import { SlotInterface } from "@eisbuk/shared";
import { PrivateRoutes } from "@eisbuk/shared/ui";
import i18n, { AdminAria, SlotsAria } from "@eisbuk/translations";

import { slots } from "../__testData__/slots.json";

const testDateLuxon = DateTime.fromISO("2022-01-01");

describe("Slots copy button - copied slots badge", () => {
  beforeEach(() => {
    // App setup
    cy.setClock(testDateLuxon.toMillis());
    cy.initAdminApp()
      .then((organization) =>
        cy.updateSlots(organization, slots as Record<string, SlotInterface>)
      )
      .then(() => cy.signIn())
      // Load the view before making any assertions
      .then(() => cy.visit(PrivateRoutes.Slots))
      // Make sure to wait enough time for the slots to be fetched:
      // The word "competitive" will appear only when slots are displayed.
      // For some reason the wait time in the CI is significantly longer then locally
      // @TODO check if this is still necessary after we make the e2e tests a bit leaner
      .then(() => cy.contains("competitive", { timeout: 20000 }));

    cy.getAttrWith("aria-label", i18n.t(SlotsAria.EnableEdit)).click();
  });

  it("shows the week copied badge only if in 'week' context and the week in clipboard is the currently observed week", () => {
    // The badge should not be shown as there are no slots copied yet.
    cy.getByTestId("copied-slots-week-badge").getAttrWith(
      "aria-hidden",
      "true"
    );

    // Copy the slots for the current week
    cy.getByTestId("copy-week-button").click({ force: true });

    // The badge should now be shown as the copied slots belong to the current week.
    cy.getByTestId("copied-slots-week-badge").getAttrWith(
      "aria-hidden",
      "false"
    );

    // Go to the next week
    cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();

    // The badge should not be shown anymore as the copied slots belong to the previous week.
    cy.getByTestId("copied-slots-week-badge").getAttrWith(
      "aria-hidden",
      "true"
    );
  });

  it("shows the day copied badge only if in 'day' context and the day in clipboard is the corresponding day", () => {
    const date = testDateLuxon;

    // The badge should not be shown as there are no slots copied yet.
    cy.getByTestId("copied-slots-day-badge", { date }).getAttrWith(
      "aria-hidden",
      "true"
    );

    // Copy the slots for the current day
    cy.getByTestId("copy-day-button", { date }).click({ force: true });

    // The badge should now be shown as the copied slots belong to the current day.
    cy.getByTestId("copied-slots-day-badge", { date }).getAttrWith(
      "aria-hidden",
      "false"
    );

    // Check different date slot (the badge should not be shown)
    cy.getByTestId("copied-slots-day-badge", {
      date: date.plus({ days: 1 }),
    }).getAttrWith("aria-hidden", "true");
  });
});
