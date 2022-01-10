import { PrivateRoutes } from "@/enums/routes";
import {
  __create100Athletes__,
  __debugButtonId__,
  __customersGridId__,
  __confirmDialogYesId__,
  __notificationButton__,
  __customersDialogId__,
} from "@/__testData__/testIds";
import {
  __customerDeleteId__,
  __customerEditId__,
} from "../../src/components/atoms/CustomerList/__testData__/testIds";

describe("athletes grid", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    cy.initAdminApp();
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", __debugButtonId__).click();
    cy.getAttrWith("data-testid", __create100Athletes__).click();
  });
  it("should click the athlete to open a dialog", () => {
    cy.getAttrWith("data-testid", __customersGridId__)
      .children()
      .first()
      .click();
    cy.getAttrWith("data-testid", __customersDialogId__);
  });
});

describe("button actions", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    cy.initAdminApp();
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", __debugButtonId__).click();
    cy.getAttrWith("data-testid", __create100Athletes__).click();
  });

  it("should delete an athlete and check for dialog closing", () => {
    cy.getAttrWith("data-testid", __customersGridId__)
      .children()
      .first()
      .click();
    cy.getAttrWith("data-testid", __customerDeleteId__).click();
    cy.getAttrWith("data-testid", __confirmDialogYesId__).click();
    cy.getAttrWith("data-testid", __customersDialogId__).should("not.exist");
    cy.getAttrWith("data-testid", __notificationButton__);
  });
  it("should edit an athlete and check for dialog closing", () => {
    cy.getAttrWith("data-testid", __customersGridId__)
      .children()
      .first()
      .click();
    cy.getAttrWith("data-testid", __customerEditId__).click();
    cy.getAttrWith("value", "competitive").check();
    cy.getAttrWith("type", "submit").click();
    cy.getAttrWith("data-testid", __customersDialogId__).should("not.exist");
    cy.getAttrWith("data-testid", __notificationButton__);
  });
});
