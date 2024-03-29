import { Customer } from "@eisbuk/shared";
import { Routes } from "@eisbuk/shared/ui";
import i18n, {
  ActionButton,
  CustomerNavigationLabel,
  NotificationMessage,
  ValidationMessage,
} from "@eisbuk/translations";

import { customers } from "../__testData__/customers.json";

// extract saul from test data .json
const saul = {
  ...customers.saul,
  // The exact timestamp is irrelevant (it's only important it's there).
  // We're setting this here so as to not show publicy policy toast (obstructing the test runner's view)
  privacyPolicyAccepted: { timestamp: "2022-01-01" },
} as Customer;

// Remove the "dial code" from saul's phone
const saulsDialCode = "IT (+39)";
const saulsPhone = saul.phone!.substring(3);

describe("athlete profile", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    cy.initAdminApp().then((organization) =>
      cy.updateCustomers(organization, { saul } as Record<string, Customer>)
    );
    cy.signOut();

    cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));

    // Wait for Saul's data to be loaded
    cy.contains(`${saul.name} ${saul.surname}`);

    // Navigate to profile
    cy.clickButton(i18n.t(CustomerNavigationLabel.Profile) as string);
    // Toggle edit mode
    cy.clickButton(i18n.t(ActionButton.Edit) as string);
    // Wait for edit mode to be enabled before making furter assertions
    cy.get("input").first().should("be.enabled");
  });

  it("fills and submits athlete profile form", () => {
    cy.getAttrWith("name", "name").should("have.attr", "value", saul.name);
    cy.getAttrWith("name", "name").clearAndType(saul.name);

    cy.getAttrWith("name", "surname").clearAndType(saul.surname);
    cy.getAttrWith("name", "birthday").clearAndType(saul.birthday || "");
    cy.getAttrWith("name", "email").clearAndType(saul.email || "");
    cy.getAttrWith("id", "dialCode").select(saulsDialCode);
    cy.getAttrWith("name", "phone").clearAndType(saulsPhone);
    cy.getAttrWith("name", "certificateExpiration").clearAndType(
      saul.certificateExpiration || ""
    );
    cy.getAttrWith("type", "submit").click();
    cy.contains(i18n.t(NotificationMessage.CustomerProfileUpdated) as string);
  });

  it("allows customer form submission with minimal fields", () => {
    cy.getAttrWith("name", "certificateExpiration").clear();

    cy.getAttrWith("type", "submit").click();
    cy.contains(i18n.t(NotificationMessage.CustomerProfileUpdated) as string);
  });

  it("doesn't allow invalid date input format", () => {
    cy.getAttrWith("name", "birthday").clearAndType("12 nov 2021");

    cy.getAttrWith("type", "submit").click();
    // check invalid date message
    cy.contains(i18n.t(ValidationMessage.InvalidDate) as string);
  });

  it("doesn't allow invalid phone input format", () => {
    // test phone number for edge cases
    cy.getAttrWith("name", "phone").clearAndType("foo 2222 868");
    cy.getAttrWith("type", "submit").click();
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    cy.getAttrWith("name", "phone").clearAndType("2222 868 foo");
    cy.getAttrWith("type", "submit").click();
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    // test too long and too short phone numbers
    cy.getAttrWith("name", "phone").clearAndType("2222 86877777777777");
    cy.getAttrWith("type", "submit").click();
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    cy.getAttrWith("name", "phone").clearAndType("2222");
    cy.getAttrWith("type", "submit").click();
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    // make sure phone number length can't be "cheated" with too much whitespace
    cy.getAttrWith("name", "phone").clearAndType("099   11");
    cy.getAttrWith("type", "submit").click();
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);
  });

  it("replaces different date separators ('.' and '-') with '/'", () => {
    // dashes
    cy.getByTestId("birthday-input").clearAndType("12-12-1990");
    cy.getByTestId("birthday-input").should("contain.value", "12/12/1990");

    // dots
    cy.getByTestId("birthday-input").clearAndType("12.12.1990");
    cy.getAttrWith("value", "12/12/1990");
  });

  it("handles edge (passable) cases of input", () => {
    const archer = {
      // test two names string (should be passable)
      name: "Sterling Malory",
      surname: "Archer",
      // test whitespaces in the phone number
      // (should be removed in submitting function passable)
      phone: "99 6622 545",
      // check insanely long, but passable email
      email: "sterling.malory.archer@isis.not-gov.us",
      birthday: saul.birthday,
    };
    cy.getAttrWith("name", "name").clearAndType(archer.name);
    cy.getAttrWith("name", "surname").clearAndType(archer.surname);
    cy.getAttrWith("name", "phone").clearAndType(archer.phone);
    cy.getAttrWith("name", "email").clearAndType(archer.email);
    cy.getAttrWith("name", "birthday").clearAndType(archer.birthday || "");

    // all of the data above should be submitable
    cy.getAttrWith("type", "submit").click();
    cy.contains(i18n.t(NotificationMessage.CustomerProfileUpdated) as string);
  });
});
