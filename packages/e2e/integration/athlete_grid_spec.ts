import { PrivateRoutes } from "../temp";

describe("athletes grid", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    cy.initAdminApp()
      .then((organization) =>
        cy.updateFirestore(organization, ["customers.json"])
      )
      .then(() => cy.signIn())
      .then(() => cy.visit(PrivateRoutes.Athletes));
  });

  it("opens CustomerCard modal with the customer on customer click and closes on close button click", () => {
    cy.contains("Saul").click();
    cy.getAttrWith("aria-label", "customer-dialog");
    cy.getAttrWith("aria-label", "close-button").click();
    cy.getAttrWith("aria-label", "customer-dialog").should("not.exist");
  });

  it("updates CustomerCard modal when customer gets updated", () => {
    cy.contains("Saul").click();
    cy.getAttrWith("aria-label", "edit").click();
    cy.getAttrWith("name", "phone").clearAndType("1111 111");
    cy.getAttrWith("name", "name").clearAndType("Jimmy");
    cy.getAttrWith("type", "submit").click();
    cy.getAttrWith("aria-label", "customer-dialog").contains("Jimmy");
  });
});
