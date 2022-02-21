import initializeCommands from "./commands";

import { __storybookDate__ as __staticTestDate__ } from "@/lib/constants";

import "cypress-mochawesome-reporter/register";
import addFirebaseCommands from "cypress/plugins/firebasePlugin/commands";

// add firebase-related commands (from firebasePlugin)
addFirebaseCommands();

// add our custom convenience commands
initializeCommands();

// Overrides browser global Date Object to start from the first week of March 2021
// This means "new Date()" will always return Monday 1st March 2021 in all tests
beforeEach(() => {
  const time = new Date(__staticTestDate__).getTime();
  cy.clock(time, ["Date"]);
});
