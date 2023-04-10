import { DateTime } from "luxon";

import {
  SlotInterface,
  __copyWeekButtonId__,
  __copiedSlotsBadgeId__,
} from "@eisbuk/shared";
import i18n, { AdminAria, SlotsAria } from "@eisbuk/translations";

import { PrivateRoutes } from "../temp";

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
    const weekStart = testDateLuxon.startOf("week");
    const weekEnd = testDateLuxon.endOf("week");

    // The badge should not be shown as there are no slots copied yet.
    cy.getAttrWith("data-testid", __copiedSlotsBadgeId__).should(
      "have.attr",
      "aria-hidden",
      "true"
    );

    // Copy the slots for the current week
    cy.getAttrWith("data-testid", __copyWeekButtonId__).click({ force: true });

    // The badge should now be shown as the copied slots belong to the current week.
    cy.getAttrWith("data-testid", __copiedSlotsBadgeId__).should(
      "have.attr",
      "aria-hidden",
      "false"
    );

    // Go to the next week
    cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();

    const nextWeekStart = weekStart.plus({ weeks: 1 });
    const nextWeekEnd = weekEnd.plus({ weeks: 1 });

    // The badge should not be shown anymore as the copied slots belong to the previous week.
    cy.getAttrWith(
      "aria-label",
      i18n.t(SlotsAria.CopiedSlotsWeekBadge, {
        weekStart: nextWeekStart,
        weekEnd: nextWeekEnd,
      })
    ).should("have.attr", "aria-hidden", "true");
  });

  it("shows the day copied badge only if in 'day' context and the day in clipboard is the corresponding day", () => {
    const date = testDateLuxon;

    // The badge should not be shown as there are no slots copied yet.
    cy.getAttrWith(
      "aria-label",
      i18n.t(SlotsAria.CopiedSlotsDayBadge, { date })
    ).should("have.attr", "aria-hidden", "true");

    // Copy the slots for the current day
    cy.getAttrWith(
      "aria-label",
      i18n.t(SlotsAria.CopySlotsDay, { date })
    ).click({ force: true });

    // The badge should now be shown as the copied slots belong to the current day.
    cy.getAttrWith(
      "aria-label",
      i18n.t(SlotsAria.CopiedSlotsDayBadge, { date })
    ).should("have.attr", "aria-hidden", "false");

    // Check different date slot (the badge should not be shown)
    cy.getAttrWith(
      "aria-label",
      i18n.t(SlotsAria.CopiedSlotsDayBadge, { date: date.plus({ days: 1 }) })
    ).should("have.attr", "aria-hidden", "true");
  });
});
