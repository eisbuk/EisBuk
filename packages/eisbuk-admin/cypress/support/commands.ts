/* eslint-disable @typescript-eslint/no-namespace */
import { HttpRequestInterceptor } from "cypress/types/net-stubbing";

import { Customer } from "eisbuk-shared";

import i18n from "@/i18next/i18n";

import { ActionButton } from "@/enums/translations";

// ***********************************************************
//
// When adding a new Command in command initializing procedure, add the
// function interface here as well in order to be able to use
// it in tests without TypeScript complaining
//
// All of the commands should extend the following interface:
//
//       (...args?: any[]) => Chainable<R extends any = null>
//

// ***********************************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * @param {string} attr A DOM element attribute - e.g [attr=]
       * @param {string} label A value for the attribute - [=label]
       * @param {boolean} strict Default True. False means attribute value can contain label - [*=label]
       * @returns {Chainable<Element>} a `PromiseLike` yielding found `Element`
       */
      getAttrWith: (
        attr: string,
        label: string,
        strict?: boolean
      ) => Chainable<Element>;
      /**
       * @param {number} millis milliseconds from UNIX epoch, such as it's received from `Date.now()`.
       */
      setClock: (millis: number) => Chainable<Clock>;
      /**
       * Helper used to reduce test code redundancy.
       * Fills in the form for a passed customer.
       * Each field in customer param is optional, so the function
       * will only fill fields which are passed in.
       * @customer customer entry
       */
      fillInCustomerData: (customer: Partial<Customer>) => Chainable<void>;
      /**
       * Cancels the existing `CustomerForm` ane opens a new one
       */
      resetCustomerForm: () => Chainable<void>;
      /**
       * Similar to `Chainable<Element>.type(input)`:
       * - performs `.clear()` on an element
       * - performs `.type(input)` on an element
       * - performs `.blur()` after typing in the value
       * @param {string} input
       */
      clearAndType: (input: string) => Chainable<Element>;
      /**
       * A convenience method to avoid typing `get("button").contains(<label>).click()` each time.
       * Always uses `click({ force: true })` to avoid failing on buttons detatched after click.
       * @param {string} label button label
       * @param {number} eq optional element index (if multiple elements found)
       */
      clickButton: (label: string, eq?: number) => Chainable<Element>;
      /**
       * A utility wrapper around cy.intercept. Allows us to intercept the message the specified number
       * of times, after which the request goes through.
       * @param {number} times number of times to intercept
       * @param {string} method HTTP method to intercept
       * @param {string} url URL string to match
       * @param {HttpRequestInterceptor} cb an interceptor function to stub the behaviour of the intercepted call
       */
      interceptTimes: (
        times: number,
        method: string,
        url: string,
        cb: HttpRequestInterceptor
      ) => Chainable<null>;
    }
  }
}

/**
 * We're initializing custom commands as a procedure, rather than a
 * file as this (for whatever reason) works with typescript, and the other approach doesn't
 */
export default (): void => {
  Cypress.Commands.add("getAttrWith", (attr, label, strict = true) => {
    const glob = strict ? "" : "*";
    return cy.get(`[${attr}${glob}="${label}"]`);
  });

  Cypress.Commands.add("setClock", (millis) =>
    cy.clock().then((clock) => {
      clock.restore();
      // currently we're only overriding the `Date` object
      // as overriding `setTimeout` will mess with firebase auth state
      // due to firebase auth being set up to revalidate the token each hour
      return cy.clock(millis, ["Date"]);
    })
  );

  // #region CustomerForm
  Cypress.Commands.add("fillInCustomerData", (customer: Partial<Customer>) => {
    const {
      name,
      surname,
      email,
      phone,
      birthday,
      category,
      certificateExpiration,
      covidCertificateReleaseDate,
      covidCertificateSuspended,
    } = customer;

    if (name) {
      cy.getAttrWith("name", "name").type(customer.name);
    }
    if (surname) {
      cy.getAttrWith("name", "surname").type(customer.surname);
    }
    if (email) {
      cy.getAttrWith("name", "email").type(customer.email);
    }
    if (phone) {
      cy.getAttrWith("name", "phone").type(customer.phone);
    }
    if (birthday) {
      cy.getAttrWith("placeholder", "dd/mm/yyyy").first().type(birthday);
    }
    if (category) {
      cy.getAttrWith("value", category).check();
    }
    if (certificateExpiration) {
      cy.getAttrWith("placeholder", "dd/mm/yyyy")
        .eq(1)
        .type(certificateExpiration);
    }
    if (covidCertificateReleaseDate) {
      cy.getAttrWith("placeholder", "dd/mm/yyyy")
        .eq(2)
        .type(covidCertificateReleaseDate);
    }
    if (covidCertificateSuspended) {
      cy.getAttrWith("type", "checkbox").check();
    }
  });

  Cypress.Commands.add("resetCustomerForm", () => {
    // close the form
    cy.get("button")
      .contains(i18n.t(ActionButton.Cancel) as string)
      // use force as button will be detached after click
      .click({ force: true });

    // open new form
    cy.getAttrWith("data-testid", "add-athlete").click();
  });
  // #region CustomerForm

  Cypress.Commands.add(
    "clearAndType",
    { prevSubject: "element" },
    (el: Element, input: string) => cy.wrap(el).clear().type(input).blur()
  );

  Cypress.Commands.add("clickButton", (label: string, eq = 0) => {
    cy
      // include ':contains()' in the selector to retry the assertion until the element is found
      // and prevent assertions on wrong buttons (in a render race condition kind of way)
      .get(`button:contains(${label})`)
      // if multiple elements found, get the specified 'eq' or fall back to first element found
      .eq(eq)
      .click({ force: true });
  });

  Cypress.Commands.add(
    "interceptTimes",
    (times: number, method: any, url: string, cb: HttpRequestInterceptor) =>
      cy.intercept(method, url, (req) => {
        if (times) {
          times--;
          return cb(req);
        } else {
          return req.continue();
        }
      })
  );
};
