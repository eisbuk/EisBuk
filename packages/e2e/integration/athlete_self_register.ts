import { v4 as uuid } from "uuid";

import i18n, {
  ActionButton,
  AuthTitle,
  CustomerLabel,
  Alerts,
  ValidationMessage,
} from "@eisbuk/translations";
import { CustomerFull, OrganizationData } from "@eisbuk/shared";

import { PrivateRoutes } from "../temp";

import testCustomers from "../__testData__/customers.json";
import {
  __registrationCode__,
  __displayName__,
  __emailFrom__,
} from "../constants";

import { organization as organizationData } from "../__testData__/organization.json";

// extract saul from test data .json
const saul = testCustomers.customers.saul as Required<CustomerFull>;

/** A convenience method, to avoid having to write '' each time */
const t = (input: string, params?: Record<string, any>): string =>
  i18n.t(input, params);

describe("Athlete self registration", () => {
  beforeEach(() => {
    // Initialize app, set up organization (registration code)
    cy.initAdminApp()
      .then((organization) =>
        cy.updateOrganization(
          organization,
          organizationData as OrganizationData
        )
      )
      .then(() => cy.signOut())
      .then(() => cy.clearCookies())
      .then(() => cy.visit(PrivateRoutes.Root));
  });

  afterEach(() => {
    cy.clearCookies().clearLocalStorage();
  });

  it("creates a new account with not-yet-registered email and allows for self registration using the form", () => {
    cy.getAttrWith("aria-label", t(AuthTitle.SignInWithEmail)).click();
    // since auth service is shared amongst all organizations
    // we're creating a new email each time to ensure the current email
    // is not yet registered (by any previous tests)
    const randomString = uuid().slice(0, 10);
    const newEmail = `${randomString}@email.com`;

    cy.getAttrWith("type", "email").type(newEmail);
    cy.clickButton(t(ActionButton.Next));
    cy.contains(t(AuthTitle.CreateAccount));

    cy.getAttrWith("type", "password").type("non-relevant-password");
    cy.clickButton(t(ActionButton.Save));
    // Auth user is created, but not registered in 'customers' sub collection.
    // We need to fill out a registration form.
    cy.contains(t(CustomerLabel.Welcome, { displayName: __displayName__ }));
    cy.getAttrWith("name", "name").type(saul.name);
    cy.getAttrWith("name", "surname").type(saul.surname);
    cy.getAttrWith("name", "birthday").type(saul.birthday);
    // Email should be filled out from the auth registration and disabled for editing
    cy.getAttrWith("name", "email")
      .should("have.value", newEmail)
      .should("be.disabled");

    // The wrong registration code should show as validation error
    cy.getAttrWith("name", "registrationCode").type("wrong-code");
    cy.clickButton(t(ActionButton.Save));

    cy.contains(t(ValidationMessage.InvalidRegistrationCode));

    // Fill in the (correct) registration code previously set in organization settings
    cy.getAttrWith("name", "registrationCode").clearAndType(
      __registrationCode__
    );
    cy.clickButton(t(ActionButton.Save));

    // Upon successful registration, the athlete should be stored in 'customers' collection
    // and user redirected to customer_area.
    // Since the registration is not yet revised by an admin, appropriate message (with organization contact info) should be shown.
    cy.contains(t(Alerts.NoCategories));
    cy.contains(
      t(Alerts.ContactEmail, { email: __emailFrom__ }).replace(/<\/?a.*>/g, "")
    );
  });

  it("shows a spinner while the submit request is being processed", () => {
    cy.getAttrWith("aria-label", t(AuthTitle.SignInWithEmail)).click();

    const randomString = uuid().slice(0, 10);
    const newEmail = `${randomString}@email.com`;

    cy.getAttrWith("type", "email").type(newEmail);
    cy.clickButton(t(ActionButton.Next));
    cy.contains(t(AuthTitle.CreateAccount));

    cy.getAttrWith("type", "password").type("non-relevant-password");
    cy.clickButton(t(ActionButton.Save));

    cy.intercept(
      {
        method: "POST",
        url: "**/customerSelfRegister",
      },
      (req) => {
        req.on("response", (res) => {
          console.log("waiting");
          res.setDelay(3000);
        });
      }
    );

    cy.getAttrWith("name", "name").type(saul.name);
    cy.getAttrWith("name", "surname").type(saul.surname);
    cy.getAttrWith("name", "birthday").type(saul.birthday);

    cy.getAttrWith("name", "registrationCode").type(__registrationCode__);
    cy.clickButton(t(ActionButton.Save));
    cy.contains(t(ActionButton.Saving));
  });
});
