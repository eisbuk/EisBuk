import { Customer } from "@eisbuk/shared";
import i18n, {
  ActionButton,
  CustomerNavigationLabel,
  NotificationMessage,
  ValidationMessage,
} from "@eisbuk/translations";

import { PrivateRoutes, Routes } from "../temp";

import testCustomers from "../__testData__/customers.json";

// extract saul from test data .json
const saul = testCustomers.customers.saul as Customer;
// Remove the "dial code" from saul's phone
const saulsDialCode = "IT (+39)";
const saulsPhone = saul.phone!.substring(3);

describe("add athlete", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    cy.initAdminApp();
    cy.signIn();
  });

  it("fills in the customer form and submit it", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();

    cy.fillInCustomerData(saul);
    // The phone number for saul is wrong, so we'll fix it
    cy.getAttrWith("name", "phone").clear();
    cy.getAttrWith("name", "phone").type("11111111111");
    cy.getAttrWith("type", "submit").click();
    cy.contains(
      i18n.t(NotificationMessage.CustomerUpdated, {
        name: saul.name,
        surname: saul.surname,
      }) as string
    );
  });

  it("allows customer form submission with minimal fields", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();

    cy.getAttrWith("name", "name").type(saul.name);
    cy.getAttrWith("name", "surname").type(saul.surname);
    cy.getAttrWith("value", saul.categories[0]).click();
    cy.getAttrWith("type", "submit").click();
    cy.contains(
      i18n.t(NotificationMessage.CustomerUpdated, {
        name: saul.name,
        surname: saul.surname,
      }) as string
    );
  });

  it("doesn't allow invalid date input format", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();

    cy.fillInCustomerData({
      ...saul,
      // enter invalid birthday format
      birthday: "12 nov 2021",
    });

    cy.getAttrWith("type", "submit").click();
    // check invalid date message
    cy.contains(i18n.t(ValidationMessage.InvalidDate) as string);
  });

  it("doesn't allow invalid phone input format", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();

    // test phone number for edge cases
    cy.getAttrWith("name", "phone").clearAndType("foo 2222 868");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    cy.getAttrWith("name", "phone").clearAndType("2222 868 foo");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    // test too long and too short phone numbers
    cy.getAttrWith("name", "phone").clearAndType("2222 86877777777777");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    cy.getAttrWith("name", "phone").clearAndType("2222");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    // make sure phone number length can't be "cheated" with too much whitespace
    cy.getAttrWith("name", "phone").clearAndType("099   11");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    // Test the valid number will pass
    cy.getAttrWith("name", "phone").clearAndType("99 2222 868");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string).should(
      "not.exist"
    );
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
      phone: "999 6622 545",
      // check insanely long, but passable email
      email: "sterling.malory.archer@isis.not-gov.us",
    };
    cy.fillInCustomerData(archer);

    // all of the data above should be submitable
    cy.getAttrWith("type", "submit").click();
    cy.contains(
      i18n.t(NotificationMessage.CustomerUpdated, {
        name: archer.name,
        surname: archer.surname,
      }) as string
    );
  });

  it("prefills the number field of the first athlete", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();
    cy.getAttrWith("name", "subscriptionNumber").should("have.value", "1");
  });

  it("prefills the number field with max + 1", () => {
    cy.initAdminApp().then((organization) =>
      cy.updateFirestore(organization, ["saul_with_extended_date.json"])
    );
    cy.visit(PrivateRoutes.Athletes);
    // We need to wait for athletes to be loaded: if we click the "Add athlete"
    // button too early we'll get a default value of 1
    cy.contains("Saul"); // I will only speak in the presence of my lawyer!
    cy.contains("Goodman");
    cy.getAttrWith("data-testid", "add-athlete").click();
    cy.getAttrWith("name", "subscriptionNumber").should("have.value", "42");
  });
});

describe("athlete profile", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    cy.initAdminApp().then((organization) =>
      cy.updateFirestore(organization, ["customers.json"])
    );
    cy.signOut();

    cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
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
    cy.getAttrWith("name", "covidCertificateReleaseDate").clearAndType(
      saul.covidCertificateReleaseDate || ""
    );
    cy.getAttrWith("name", "covidCertificateSuspended").click();
    cy.getAttrWith("type", "submit").click();
    cy.contains(i18n.t(NotificationMessage.CustomerProfileUpdated) as string);
  });

  it("allows customer form submission with minimal fields", () => {
    cy.getAttrWith("name", "certificateExpiration").clear();
    cy.getAttrWith("name", "covidCertificateReleaseDate").clear();

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
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .first()
      .clearAndType("12-12-1990");
    cy.getAttrWith("value", "12/12/1990");

    // dots
    cy.getAttrWith("placeholder", "dd/mm/yyyy")
      .first()
      .clearAndType("12.12.1990");
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
