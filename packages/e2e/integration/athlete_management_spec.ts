import {
  Customer,
  __addAthleteId__,
  __birthdayInputId__,
} from "@eisbuk/shared";
import i18n, {
  ActionButton,
  NotificationMessage,
  ValidationMessage,
} from "@eisbuk/translations";

import { PrivateRoutes } from "../temp";

import { customers } from "../__testData__/customers.json";
import { customers as saulWithExtendedDate } from "../__testData__/saul_with_extended_date.json";

// extract saul from test data .json
const saul = customers.saul as Customer;

describe("Athlete form", () => {
  beforeEach(() => {
    // Initialize app, create default user,
    // create default organization, sign in as admin
    cy.initAdminApp();
    cy.signIn();
  });

  it("fills in the customer form and submits it", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getByTestId(__addAthleteId__).click();

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
    cy.getByTestId(__addAthleteId__).click();

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
    cy.getByTestId(__addAthleteId__).click();

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
    cy.getByTestId(__addAthleteId__).click();

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
    cy.getByTestId(__addAthleteId__).click();

    cy.fillInCustomerData(saul);

    // dashes
    cy.getByTestId(__birthdayInputId__).first().clearAndType("12-12-1990");

    // dots
    cy.getAttrWith("value", "12/12/1990");
    cy.getByTestId(__birthdayInputId__).first().clearAndType("12.12.1990");
    cy.getAttrWith("value", "12/12/1990");
  });

  it("handles edge (passable) cases of input", () => {
    cy.visit(PrivateRoutes.Athletes);
    cy.getByTestId(__addAthleteId__).click();

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
    cy.getByTestId(__addAthleteId__).click();
    cy.getAttrWith("name", "subscriptionNumber").should("have.value", "1");
  });

  it("prefills the number field with max + 1", () => {
    cy.initAdminApp().then((organization) =>
      cy.updateCustomers(
        organization,
        saulWithExtendedDate as Record<string, Customer>
      )
    );
    cy.visit(PrivateRoutes.Athletes);
    // We need to wait for athletes to be loaded: if we click the "Add athlete"
    // button too early we'll get a default value of 1
    cy.contains("Saul"); // I will only speak in the presence of my lawyer!
    cy.contains("Goodman");
    cy.getByTestId(__addAthleteId__).click();
    cy.getAttrWith("name", "subscriptionNumber").should("have.value", "42");
  });
});

describe("Delete an athlete", () => {
  beforeEach(() => {
    cy.initAdminApp()
      .then((organization) =>
        cy.updateCustomers(organization, customers as Record<string, Customer>)
      )
      .then(() => cy.signIn())
      .then(() => cy.visit(PrivateRoutes.Athletes));
  });

  it("deletes the customer and redirects back to athletes page", () => {
    // Open Saul's details
    cy.contains(saul.name).click();

    // Fire the delete action
    cy.get("button")
      .contains(i18n.t(ActionButton.DeleteCustomer) as string)
      .click();
    // Confirm the prompt
    /**
     * @WARNING This is a very dirty hack (depending on the view having exactly 14 buttons),
     * but cy, for some reason couldn't find the button by its (exact) text: "Delete".
     */
    cy.get("button").eq(13).click();

    // Should get redirected to the /athletes page and, containing all of the customers except Saul
    cy.url().should("include", PrivateRoutes.Athletes);
    Object.values(customers)
      .filter(({ id }) => id !== saul.id)
      .forEach(({ name }) => cy.contains(name));
    cy.contains(saul.name).should("not.exist");
  });
});
