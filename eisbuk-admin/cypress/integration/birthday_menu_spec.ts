import { PrivateRoutes } from "@/enums/routes";
import { saul } from "@/__testData__/customers";
import { __birthdayMenu__ } from "@/__testData__/testIds";
import { DateTime } from "luxon";
import { __storybookDate__ as __staticTestDate__ } from "@/lib/constants";

describe("birthday badge", () => {
  beforeEach(() => {
    cy.initAdminApp();
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();
    cy.getAttrWith("name", "name").type(saul.name);
    cy.getAttrWith("name", "surname").type(saul.surname);
    cy.getAttrWith("name", "email").type(saul.email);
    cy.getAttrWith("name", "phone").type(saul.phone);
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .first()
      .type(DateTime.fromISO(__staticTestDate__).plus({ day: 1 }).toISODate());
    cy.getAttrWith("value", "competitive").check();
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .eq(1)
      .type(saul.certificateExpiration);
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .eq(2)
      .type(saul.covidCertificateReleaseDate);
    cy.getAttrWith("type", "checkbox").check();
    cy.getAttrWith("type", "submit").click();
    cy.contains(`${saul.name} ${saul.surname} update`);
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
