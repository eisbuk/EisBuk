import i18n, {
  ActionButton,
  CustomerFormTitle,
  NavigationLabel,
} from "@eisbuk/translations";

import { PrivateRoutes } from "../temp";

describe("Test subscription between browser history (location) and the modal", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    cy.initAdminApp();
    cy.signIn();
  });

  it("closes modal when location hash is removed", () => {
    // Visit athletes page from within the app (utilising client router)
    cy.visit(PrivateRoutes.Root);
    cy.clickButton(i18n.t(NavigationLabel.Athletes) as string);

    // Open modal
    cy.getAttrWith("aria-label", i18n.t(ActionButton.AddAthlete)).click();
    cy.contains(i18n.t(CustomerFormTitle.NewCustomer) as string);

    // Go back in browser history
    cy.go("back");

    // Check that modal is closed
    cy.contains(i18n.t(CustomerFormTitle.NewCustomer) as string).should(
      "not.exist"
    );
  });
});
