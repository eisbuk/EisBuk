import { Customer } from "@eisbuk/shared";
import i18n, { ValidationMessage } from "@eisbuk/translations";

import { PrivateRoutes } from "../temp";

import testCustomers from "../__testData__/customers.json";

// extract saul from test data .json
const saul = testCustomers.customers.saul as Customer;

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
    cy.getAttrWith("name", "phone").type("+4911111111111");
    cy.getAttrWith("type", "submit").click();
    cy.contains(`${saul.name} ${saul.surname} update`);
  });

  it("allows customer form submission with minimal fields", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getAttrWith("data-testid", "add-athlete").click();

    cy.getAttrWith("name", "name").type(saul.name);
    cy.getAttrWith("name", "surname").type(saul.surname);
    cy.getAttrWith("value", saul.category).check();

    cy.getAttrWith("type", "submit").click();
    cy.contains(`${saul.name} ${saul.surname} update`);
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

    // test phone number without "+" or "00" prepended to it
    cy.getAttrWith("name", "phone").clearTypeAndEnter("099 2222 868");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    // test phone number for edge cases
    cy.getAttrWith("name", "phone").clearTypeAndEnter("foo +099 2222 868");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    cy.getAttrWith("name", "phone").clearTypeAndEnter("+099 2222 868 foo");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    // test too long and too short phone numbers
    cy.getAttrWith("name", "phone").clearTypeAndEnter(
      "+099 2222 86877777777777"
    );
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    cy.getAttrWith("name", "phone").clearTypeAndEnter("+099 2222");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    // make sure phone number length can't be "cheated" with too much whitespace
    cy.getAttrWith("name", "phone").clearTypeAndEnter("+385 099   11");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string);

    // test passable phone numbers "00" or "+" prefix and at most 16 characters of length
    cy.getAttrWith("name", "phone").clearTypeAndEnter("00385 99 2222 868");
    cy.contains(i18n.t(ValidationMessage.InvalidPhone) as string).should(
      "not.exist"
    );

    cy.getAttrWith("name", "phone").clearTypeAndEnter("+385 99 2222 868");
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
      phone: "+385 99 6622 545",
      // check insanely long, but passable email
      email: "sterling.malory.archer@isis.not-gov.us",
    };
    cy.fillInCustomerData(archer);

    // all of the data above should be submitable
    cy.getAttrWith("type", "submit").click();
    cy.contains(`${archer.name} ${archer.surname} update`);
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
    cy.contains("Saul Goodman"); // I will only speak in the presence of my lawyer!
    cy.getAttrWith("data-testid", "add-athlete").click();
    cy.getAttrWith("name", "subscriptionNumber").should("have.value", "42");
  });
});
