import { DateTime } from "luxon";

import { Customer } from "@eisbuk/shared";
import { PrivateRoutes } from "@eisbuk/shared/ui";

import { __testDate__ } from "../constants";

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
    // We should start with 2 birthdays on test date (1st of March): saul and walt in our test data
    cy.getAttrWith("data-testid", "birthday-badge").should("have.text", 2);
    // Passing the midnight, the birthday menu should update to 1 birthday (gus in our test data)
    cy.tick(time);
    cy.getAttrWith("data-testid", "birthday-badge").should("have.text", 1);
  });
});
