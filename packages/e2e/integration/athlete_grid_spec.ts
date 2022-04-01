import { PrivateRoutes } from "../temp";

/** @TEMP test ids, @TODO replace these with aria-labels if at all possible and use the single source of truth */
const __customerDeleteId__ = "customer-delete-button";
const __customerEditId__ = "customer-edit-button";
const __create100Athletes__ = "create-athletes";
const __debugButtonId__ = "debug-button";
const __customersGridId__ = "customer-grid";
const __confirmDialogYesId__ = "confirm-dialog-yes-button";
const __customersDialogId__ = "customer-dialog";
/** @TEMP */

xdescribe("athletes grid", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    // cy.intercept("POST", "http://localhost:5001/eisbuk/europe-west6/createTestData", { result: { success: true } }).as('createTestData')
    cy.initAdminApp();
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", __debugButtonId__).click();
    cy.getAttrWith("data-testid", __create100Athletes__).click();
    cy.wait("@createTestData");
  });
  it("should click the athlete to open a dialog", () => {
    cy.getAttrWith("data-testid", __customersGridId__)
      .children()
      .first()
      .click();
    cy.getAttrWith("data-testid", __customersDialogId__);
  });
});

xdescribe("button actions", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    cy.initAdminApp();
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", __debugButtonId__).click();
    cy.getAttrWith("data-testid", __create100Athletes__).click();
    // cy.intercept("http://localhost:5001/eisbuk/europe-west6/createTestData", { result: { success: true } }).as('createTestData')
    // cy.wait('@createTestData')
  });

  it("should delete an athlete and check for dialog closing", () => {
    cy.getAttrWith("data-testid", __customersGridId__)
      .children()
      .first()
      .click();
    cy.getAttrWith("data-testid", __customerDeleteId__).click();
    cy.getAttrWith("data-testid", __confirmDialogYesId__).click();
    cy.getAttrWith("data-testid", __customersDialogId__).should("not.exist");
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
  });
});
