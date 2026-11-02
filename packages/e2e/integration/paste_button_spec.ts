import { DateTime } from "luxon";

import { SlotInterface } from "@eisbuk/shared";
import { PrivateRoutes } from "@eisbuk/shared/ui";
import i18n, { AdminAria, SlotsAria } from "@eisbuk/translations";

import { misc as slots } from "../__testData__/slots";

const testDateLuxon = DateTime.fromISO("2022-01-01");

describe("Slots paste button", () => {
  beforeEach(() => {
    cy.setClock(testDateLuxon.toMillis());
    cy.initAdminApp()
      .then((organization) =>
        cy.updateSlots(organization, slots as Record<string, SlotInterface>),
      )
      .then(() => cy.signIn())
      .then(() => cy.visit(PrivateRoutes.Slots))
      .then(() => cy.contains("competitive", { timeout: 20000 }));

    cy.getAttrWith("aria-label", i18n.t(SlotsAria.EnableEdit)).eq(0).click();
  });

  it("pastes a week once, for a double click and for a later paste of the same clipboard", () => {
    cy.getByTestId("slot-card")
      .its("length")
      .then((copied) => {
        cy.getByTestId("copy-week-button").eq(0).click({ force: true });
        cy.getAttrWith("aria-label", i18n.t(AdminAria.SeeFutureDates)).click();
        cy.getByTestId("slot-card").should("not.exist");

        cy.getByTestId("paste-button").eq(0).dblclick({ force: true });
        cy.getByTestId("slot-card").should("have.length", copied);

        // Wait for the lock on the target to expire: this paste is only stopped by the slots' ids
        cy.wait(11000);
        cy.getByTestId("paste-button").eq(0).click({ force: true });
        cy.wait(5000);
        return cy.getByTestId("slot-card").should("have.length", copied);
      });
  });
});
