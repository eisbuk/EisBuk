import { PrivateRoutes } from "@/enums/routes";
import { __birthdayMenu__ } from "@/__testData__/testIds";
import { DateTime } from "luxon";
import { __storybookDate__ as __staticTestDate__ } from "@/lib/constants";
import { getOrganization } from "@/lib/getters";

describe("birthday badge", () => {
  beforeEach(() => {
    cy.initAdminApp();
    cy.updateFirestore(getOrganization(), ["customers.json"]);
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
