import { DateTime } from "luxon";

import i18n, { AdminAria, DateFormat } from "@eisbuk/translations";

import { PrivateRoutes } from "../temp";

const testDateLuxon = DateTime.fromISO("2022-01-01");

describe("Copy Button", () => {
  beforeEach(() => {
    cy.setClock(testDateLuxon.toMillis());
    cy.initAdminApp()
      .then((organization) => cy.updateFirestore(organization, ["slots.json"]))
      .then(() => cy.signIn());
  });
  it("should only show badge on copied day copy button", () => {
    cy.visit(PrivateRoutes.Slots);
    cy.getAttrWith("data-testid", "enable-edit-toggle").click();

    cy.get(".MuiBadge-invisible").should("have.length", 9);
    cy.getAttrWith(
      "aria-label",
      `${i18n.t(AdminAria.CopySlots)} ${i18n.t(DateFormat.Full, {
        date: testDateLuxon,
      })}`
    )
      .click()
      .click({ force: true });

    cy.get(".MuiBadge-invisible").should("have.length", 8);
    cy.getAttrWith(
      "aria-label",
      `${i18n.t(AdminAria.CopiedSlotsBadge)} ${i18n.t(DateFormat.Full, {
        date: testDateLuxon,
      })}`
    ).should("not.have.attr", "invisible");
  });
});
