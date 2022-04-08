declare module "cypress-mochawesome-reporter/lib" {
  export const beforeRunHook: (
    config: Cypress.BeforeRunDetails
  ) => Promise<void>;
  export const afterRunHook: () => Promise<void>;
}

declare module "@cypress/code-coverage/task" {
  const codeCoverageTask: (
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfig
  ) => void | Promise<void>;

  export default def;
}
