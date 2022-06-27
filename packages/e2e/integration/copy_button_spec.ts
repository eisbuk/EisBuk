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

    cy.getAttrWith(
      "aria-label",
      `${i18n.t(AdminAria.CopySlots)} ${i18n.t(DateFormat.Full, {
        date: testDateLuxon,
      })}`
    )
      .click() // We really need two click statements here - I'm not sure why
      .click({ force: true })
      .blur();

    cy.getAttrWith(
      "aria-label",
      `${i18n.t(AdminAria.CopiedSlotsBadge)} ${i18n.t(DateFormat.Full, {
        date: testDateLuxon,
      })}`
    ).within(() => {
      cy.get(".BaseBadge-badge").should("be.visible");
      return undefined;
    });
  });
});
