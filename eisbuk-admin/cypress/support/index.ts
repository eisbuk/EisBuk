/* eslint-disable @typescript-eslint/no-namespace */

// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";
// Alternatively you can use CommonJS syntax:
// require('./commands')

import { __storybookDate__ as __staticTestDate__ } from "@/lib/constants";

import "cypress-mochawesome-reporter/register";
import addFirebaseCommands from "cypress/plugins/firebasePlugin/commands";

// ***********************************************************
//
// When adding a new Command in "./commands.js" file, add the
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
    }
  }
}

addFirebaseCommands();

// Overrides browser global Date Object to start from the first week of March 2021
// This means "new Date()" will always return Monday 1st March 2021 in all tests
beforeEach(() => {
  const time = new Date(__staticTestDate__).getTime();
  cy.clock(time, ["Date"]);
});
