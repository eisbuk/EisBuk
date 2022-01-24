import { PrivateRoutes } from "@/enums/routes";
import { __birthdayMenu__ } from "@/__testData__/testIds";
import { DateTime } from "luxon";
import { __storybookDate__ as __staticTestDate__ } from "@/lib/constants";

describe("birthday badge", () => {
  beforeEach(() => {
    cy.initAdminApp()
      .then((organization) => {
        return cy.updateFirestore(organization as unknown as string, [
          "customers.json",
        ]);
      })
      .catch(() => console.error("Failed to initialize Firebase"));
  });
  it("should check for birthday menu rerendering on midnight", () => {
    const time =
      DateTime.fromISO(__staticTestDate__)
        .plus({ day: 1 })
        .startOf("day")
        .toMillis() - DateTime.fromISO(__staticTestDate__).toMillis();
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
