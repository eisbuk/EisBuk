import { DateTime } from "luxon";

import { Customer } from "@eisbuk/shared";
import i18n, { AdminAria } from "@eisbuk/translations";

import { __testDate__ } from "../constants";

import { PrivateRoutes } from "../temp";

import { customers } from "../__testData__/customers.json";

describe("birthday badge", () => {
  beforeEach(() => {
    cy.initAdminApp().then((organization) =>
      cy.updateCustomers(organization, customers as Record<string, Customer>)
    );
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
