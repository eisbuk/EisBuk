import { PrivateRoutes } from "@/enums/routes";
import { ValidationMessage } from "@/enums/translations";
import i18n from "@/i18next/i18n";

import { saul } from "@/__testData__/customers";

describe("add athlete", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    cy.initAdminApp();
  });

  // cy.getAttrWith("name", "phone").type("+385 99 112 4564");
  it("should fill in the customer form and submit it", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();

    cy.fillInCustomerData(saul);

    cy.getAttrWith("type", "submit").click();
    cy.contains(`${saul.name} ${saul.surname} update`);
  });

  it("doesn't allow invalid inputs and displays correct validation messages", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();

    cy.fillInCustomerData({
      ...saul,
      // enter invalid birthday format
      birthday: "12 nov 2021",
      // enter invalid phone number format (should be prepended with '+' sign)
      phone: "099 1245 555",
    });

    cy.getAttrWith("type", "submit").click();
    // check invalid date message
    cy.contains(i18n.t(ValidationMessage.InvalidDate) as string);
    // check invalid phone number message
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);
  });

  it("replaces different date separators ('.' and '-') with '/'", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();

    cy.fillInCustomerData(saul);

    // dashes
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .first()
      .clearAndType("12-12-1990");

    // dots
    cy.getAttrWith("value", "12/12/1990");
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .first()
      .clearAndType("12.12.1990");
    cy.getAttrWith("value", "12/12/1990");
  });

  it("handles edge (passable) cases of input", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();

    const archer = {
      ...saul,
      // test two names string (should be passable)
      name: "Sterling Malory",
      surname: "Archer",
      // test whitespaces in the phone number
      // (should be removed in submitting function passable)
      phone: "+385 99 6622 545",
      // check insanely long, but passable email
      email: "sterling.malory.archer@isis.not-gov.us",
    };
    cy.fillInCustomerData(archer);

    // all of the data above should be submitable
    cy.getAttrWith("type", "submit").click();
    cy.contains(`${archer.name} ${archer.surname} update`);
  });
});
