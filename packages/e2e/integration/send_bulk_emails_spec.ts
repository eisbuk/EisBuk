import { Customer, OrganizationData } from "@eisbuk/shared";
import { PrivateRoutes } from "@eisbuk/shared/ui";

import { customers } from "../__testData__/customers.json";
import { organization as organizationData } from "../__testData__/organization.json";
import i18n, { NotificationMessage, Prompt } from "@eisbuk/translations";

describe("Booking emails", () => {
  beforeEach(() => {
    cy.initAdminApp().then((organization) => {
      cy.updateCustomers(organization, customers as Record<string, Customer>);
      cy.updateOrganization(organization, organizationData as OrganizationData);
      return;
    });
    cy.signIn();
  });

  it("sends emails to multiple athletes", () => {
    cy.visit(PrivateRoutes.Root);
    cy.getAttrWith("data-testid", "booking-emails").click();

    // save button is disabled
    cy.getAttrWith("type", "submit").should("be.disabled");

    // click select menu
    cy.getAttrWith("data-testid", "select-athletes").click();

    // select 1 athlete with no email or select all
    cy.getAttrWith("type", "checkbox").eq(8).click();

    // click send
    cy.getAttrWith("type", "submit").click({ force: true });

    // check for no email msg and disabled btn
    cy.contains(i18n.t(Prompt.NoBulkEmailMessage) as string);
    cy.getAttrWith("data-cy", "prompt-confirm-button").should("be.disabled");

    // click cancel
    cy.getAttrWith("data-cy", "prompt-cancel-button").click();

    // select 2 other athletes
    cy.getAttrWith("data-testid", "select-athletes").click();
    cy.getAttrWith("type", "checkbox").eq(8).click();
    cy.getAttrWith("type", "checkbox").eq(2).click();
    cy.getAttrWith("type", "checkbox").eq(3).click();

    // click send
    cy.getAttrWith("type", "submit").click({ force: true });

    // check confirmation msg for 2 athletes
    cy.contains(
      i18n.t(Prompt.SendBulkEmailMessage, {
        athletesNumber: 2,
      }) as string
    );
    cy.getAttrWith("data-cy", "prompt-confirm-button").click();

    // check for notification toasts for sending email
    cy.getByTestId("notification-toast").contains(
      i18n.t(NotificationMessage.EmailSent) as string
    );
    // check for notification toasts for updating the templates
    cy.getByTestId("notification-toast").contains(
      i18n.t(NotificationMessage.Updated) as string
    );
  });
});
