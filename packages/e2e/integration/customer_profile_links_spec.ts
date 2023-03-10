import i18n, {
  ActionButton,
  AdminAria,
  BirthdayMenu,
  CustomerFormTitle,
  OrganizationLabel,
} from "@eisbuk/translations";
import { DateTime } from "luxon";
import { getSlotTimespan, PrivateRoutes } from "temp";

import { customers } from "../__testData__/customers.json";
import { slots } from "../__testData__/slots.json";

const { saul } = customers;

describe("Test customer avatars linking to the respective customer profiles", () => {
  it("links to the customer profile when clicking on a customer in /athletes page (and redirects back on 'back' click)", () => {
    cy.initAdminApp().then((organization) => {
      // We'll be needing the customer data for each test
      return cy.updateFirestore(organization, ["customers.json", "slots.json"]);
    });
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

  it("links to the customer profile when clicking on a customer in attendance (\"/\") page (and redirects back on 'back' click)", () => {
    cy.initAdminApp().then((organization) => {
      // We'll be needing the customer data for each test
      return cy.updateFirestore(organization, ["customers.json", "slots.json"]);
    });

    cy.signIn();
    // Set clock to "2022-01-01" as there is a test slot on that date
    cy.setClock(DateTime.fromISO("2022-01-01").toMillis()).then(() =>
      cy.visit(PrivateRoutes.Root)
    );

    // Add saul as having attended the slot
    cy.getAttrWith(
      "aria-label",
      i18n.t(AdminAria.AddAttendedCustomers) as string
    ).click();
    cy.contains(saul.name).click();

    // Close the modal and click on saul to open his profile
    cy.getAttrWith("aria-label", i18n.t(AdminAria.CloseModal)).click();
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

    // Check that we're back on the attendance page (by querying for slot interval, displayed on attendance card)
    cy.contains(getSlotTimespan(slots["slot-1"].intervals));
  });

  it("links to the customer profile when clicking on a customer on birthday menu (and redirects back to the given page on 'back' click)", () => {
    let organization = "";
    cy.initAdminApp().then((org) => {
      // Update `organization` variable so we can use it in the test
      organization = org;
      // We'll be needing the customer data for each test
      return cy.updateFirestore(org, ["customers.json", "slots.json"]);
    });
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

    // Check that we're back on the attendance page (by querying for slot interval, displayed on attendance card)
    cy.contains(
      i18n.t(OrganizationLabel.SettingsTitle, { organization }) as string
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

    // Check that we're back on the attendance page (by querying for slot interval, displayed on attendance card)
    cy.contains(
      i18n.t(OrganizationLabel.SettingsTitle, { organization }) as string
    );
  });
});