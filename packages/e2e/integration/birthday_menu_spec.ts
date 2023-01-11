import i18n, { AdminAria } from "@eisbuk/translations";
import { DateTime } from "luxon";

import { __testDate__ } from "../constants";

import { PrivateRoutes } from "../temp";

describe("birthday badge", () => {
  beforeEach(() => {
    cy.initAdminApp().then((organization) => {
      return cy.updateFirestore(organization, ["customers.json"]);
    });
    cy.signIn();
  });

  it("updates the birthday menu at midnight", () => {
    const time =
      DateTime.fromISO(__testDate__)
        .plus({ day: 1 })
        .startOf("day")
        .toMillis() - DateTime.fromISO(__testDate__).toMillis();
    cy.visit(PrivateRoutes.Root);
    cy.getAttrWith("aria-label", i18n.t(AdminAria.BirthdayMenu) as string)
      .children()
      .eq(1)
      .should("have.text", 0);
    cy.tick(time);
    cy.getAttrWith("aria-label", i18n.t(AdminAria.BirthdayMenu) as string)
      .children()
      .eq(1)
      .should("have.text", 1);
  });
});
