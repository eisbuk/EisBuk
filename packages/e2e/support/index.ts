import "cypress-mochawesome-reporter/register";
import "@cypress/code-coverage/support";

import i18n from "@eisbuk/translations";
import * as translations from "@eisbuk/translations";

import { __testDate__ } from "../constants";

import initializeCommands from "./commands";

import addFirebaseCommands from "../plugins/firebasePlugin/commands";

// add firebase-related commands (from firebasePlugin)
addFirebaseCommands();

// add our custom convenience commands
initializeCommands();

// Overrides browser global Date Object to start from the first week of March 2021
// This means "new Date()" will always return Monday 1st March 2021 in all tests
beforeEach(() => {
  const time = new Date(__testDate__).getTime();
  cy.clock(time, ["Date"]);

  // stub i18n to use the i18n initialized in cypress so that both
  // our tests and app runtime are "on the same page" regarding i18n
  cy.stub(i18n, "t").callsFake((...args: Parameters<typeof i18n.t>) =>
    i18n.t(...args)
  );
  cy.stub(translations, "useTranslation").callsFake(() => i18n.t);
});

afterEach(() => {
  // auth from previous tests shouldn't affect the following tests
  cy.signOut();
});
