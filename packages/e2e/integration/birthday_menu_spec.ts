import { DateTime } from "luxon";

import { __testDate__ } from "../constants";

import { PrivateRoutes } from "../temp";

/** @TEMP test ids, @TODO replace these with aria-labels if at all possible and use the single source of truth */
const __birthdayMenu__ = "birthday-menu";
/** @TEMP */

/** @TEMP skipped until we find a place for them in the new admin bar */
xdescribe("birthday badge", () => {
  beforeEach(() => {
    cy.initAdminApp().then((organization) => {
      return cy.updateFirestore(organization, ["customers.json"]);
    });
    cy.signIn();
  });
  it("should check for birthday menu rerendering on midnight", () => {
    const time =
      DateTime.fromISO(__testDate__)
        .plus({ day: 1 })
        .startOf("day")
        .toMillis() - DateTime.fromISO(__testDate__).toMillis();
    cy.visit(PrivateRoutes.Root);
    cy.getAttrWith("data-testid", __birthdayMenu__)
      .children()
      .eq(1)
      .should("have.text", 0);
    cy.tick(time);
    cy.getAttrWith("data-testid", __birthdayMenu__)
      .children()
      .eq(1)
      .should("have.text", 1);
  });
});
