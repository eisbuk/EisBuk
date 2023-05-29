import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "j8dx4d",
  fixturesFolder: "fixtures",
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("./plugins/index.ts")(on, config);
    },
    supportFile: "support/index.ts",
    specPattern: "integration/**/*.{js,jsx,ts,tsx}",
    baseUrl: "http://127.0.0.1:5000",
  },

  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    reportDir: "reports/html",
    reportTitle: "EisBuk-e2e",
    overwrite: true,
    saveHtml: true,
  },

  video: false,
  defaultCommandTimeout: 15000,
});
