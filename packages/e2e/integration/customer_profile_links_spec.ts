import { Customer, SlotInterface } from "@eisbuk/shared";
import i18n, {
  ActionButton,
  AdminAria,
  BirthdayMenu,
  CustomerFormTitle,
  OrganizationLabel,
} from "@eisbuk/translations";
import { DateTime } from "luxon";
import { PrivateRoutes } from "temp";

import { customers } from "../__testData__/customers.json";
import { slots } from "../__testData__/slots.json";

const { saul } = customers;

describe("Test customer avatars linking to the respective customer profiles", () => {
  it("links to the customer profile when clicking on a customer in /athletes page (and redirects back on 'back' click)", () => {
    cy.initAdminApp()
      .then((organization) =>
        cy.updateCustomers(organization, customers as Record<string, Customer>)
      )
      .then((organization) =>
        cy.updateSlots(organization, slots as Record<string, SlotInterface>)
      );
    cy.signIn();

    // Click on saul's avatar in the athletes page
    cy.visit(PrivateRoutes.Athletes);
    cy.contains(saul.name).click();

    // Check that we're in the customer profile page
    cy.contains(
      i18n.t(CustomerFormTitle.AthleteProfile, {
        name: saul.name,
        surname: saul.surname,
      }) as string
    );

    // Click the 'back' button
    cy.clickButton(i18n.t(ActionButton.Back));

    // Check that we're back in the athletes page (by checking every customer being available on the screen)
    Object.values(customers).forEach(({ name, surname }) => {
      cy.contains(name);
      cy.contains(surname);
    });
  });

  it("links to the customer profile when clicking on a customer on birthday menu (and redirects back to the given page on 'back' click)", () => {
    cy.initAdminApp()
      .then((organization) => cy.wrap(organization).as("organization"))
      .then((org) =>
        cy.updateCustomers(org, customers as Record<string, Customer>)
      )
      .then((organization) =>
        cy.updateSlots(organization, slots as Record<string, SlotInterface>)
      );

    cy.signIn();

    // We wish to see saul in the birthday menu
    cy.setClock(DateTime.fromISO(saul.birthday).toMillis()).then(() =>
      // We're using Admin preferences page to test redirecting from and to
      cy.visit(PrivateRoutes.AdminPreferences)
    );

    // Clicking on saul in the birthday menu should redirect to saul's customer profile
    cy.getAttrWith(
      "aria-label",
      i18n.t(AdminAria.BirthdayMenu) as string
    ).click();
    cy.contains(saul.name).click();

    // Check that we're in the customer profile page
    cy.contains(
      i18n.t(CustomerFormTitle.AthleteProfile, {
        name: saul.name,
        surname: saul.surname,
      }) as string
    );

    // Click the 'back' button
    cy.clickButton(i18n.t(ActionButton.Back));

    // Check that we're back on the admin preferences page (by querying for organization admins label)
    cy.get<string>("@organization").then((organization) =>
      cy.contains(i18n.t(OrganizationLabel.Admins, { organization }) as string)
    );

    // Check again for saul in the birthday menu dialog
    cy.getAttrWith(
      "aria-label",
      i18n.t(AdminAria.BirthdayMenu) as string
    ).click();
    cy.contains(i18n.t(BirthdayMenu.ShowAll) as string).click();
    cy.contains(saul.name).click();

    // Check that we're in the customer profile page
    cy.contains(
      i18n.t(CustomerFormTitle.AthleteProfile, {
        name: saul.name,
        surname: saul.surname,
      }) as string
    );

    // Click the 'back' button
    cy.clickButton(i18n.t(ActionButton.Back));

    // Check that we're back on the admin preferences page (by querying for organization admins label)
    cy.get<string>("@organization").then((organization) =>
      cy.contains(i18n.t(OrganizationLabel.Admins, { organization }) as string)
    );
  });
});
