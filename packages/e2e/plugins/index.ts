// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

import { beforeRunHook, afterRunHook } from "cypress-mochawesome-reporter/lib";
import firebasePlugin from "./firebasePlugin";
import codeCoverageTask from "@cypress/code-coverage/task";
import { rmdir } from "fs";

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
module.exports = (on: Cypress.PluginEvents, config: Cypress.PluginConfig) => {
  on("before:run", async (details) => {
    console.log("override before:run");
    await beforeRunHook(details);
  });

  on("after:run", async () => {
    console.log("override after:run");
    await afterRunHook();
  });

  on("task", {
    deleteFolder(folderName) {
      console.log("deleting folder %s", folderName);

      return new Promise((resolve, reject) => {
        // eslint-disable-next-line consistent-return
        rmdir(folderName, { maxRetries: 10, recursive: true }, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error(err);
            return reject(err);
          }
          resolve(null);
        });
      });
    },
  });
  // initilize firebase plugin with commands and handlers
  firebasePlugin(on);
  codeCoverageTask(on, config);
  return config;
};
