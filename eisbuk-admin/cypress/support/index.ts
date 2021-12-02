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
import { __storybookDate__ as __staticTestDate__ } from "@/lib/constants";
// Alternatively you can use CommonJS syntax:
// require('./commands')

// ***********************************************************
//
// When adding a new Command in "./commands.js" file, add the
// function interface here as well in order to be able to use
// it in tests without TypeScript complaining
//
// All of the commands should extend the following interface:
//
//       (...args?: any[]) => Chainable<Element>
//
// ***********************************************************
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Run this command before each test in order to test the app with admin access, it:
       * - initializes a new `eisbuk` app
       * - creates a random name organization and adds organization name to local storage
       * - creates a default organization with given name
       * - creates/logs-in a default user (admin of default organization)
       */
      initAdminApp: (doLogin?: boolean) => Chainable<Element>;
      /**
       * @param {string} attr A DOM element attribute - e.g [attr=]
       * @param {string} label A value for the attribute - [=label]
       * @param {boolean} strict Default True. False means attribute value can contain label - [*=label]
       */
      getAttrWith: (
        attr: string,
        label: string,
        strict?: boolean
      ) => Chainable<Element>;
      // /**
      //  * Logs message to node terminal instead of browsers console.
      //  * @param {string} msg A message to log to terminal
      //  */
      // logToServer: (msg: string) => Chainable<Element>;
      endLog: () => Chainable<Element>;
    }
  }
}

beforeEach(() => {
  // Overrides browser global Date Object to start from the first week of March 2021
  // This means "new Date()" will always return Monday 1st March 2021 in all tests
  const time = new Date(__staticTestDate__).getTime();
  cy.clock(time, ["Date"]);

  // Stub the window console to send console message to the logging
  // server instead
  const { titlePath } = Cypress.currentTest;
  const testname = titlePath.join("_");

  cy.on("window:before:load", (win) => {
    win.console.log = (...message: any[]) => {
      win.fetch(`http://localhost:8888?testname=${testname}`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
    };
  });
});

after(() => {
  cy.endLog();
});
