const scaffold = require("../scaffolding/.eslintrc.ui.js");

const path = require("path");

module.exports = {
  ...scaffold,
  parserOptions: {
    ...scaffold.parserOptions,
    project: [
      path.join(__dirname, "./tsconfig.json"),
      "./esbuild/tsconfig.json",
      "./cypress/tsconfig.json",
    ],
  },
  root: true,
  ignorePatterns: [
    ...scaffold.ignorePatterns,
    "dev-server-meta/" /** @TODO remove this when we switch to vite */,
    "coverage/",
    "setupTests.js",
    "nyc-config.js",
    "jest.config.js",
    "esbuild/bundler.js",
  ],
  rules: {
    ...scaffold.rules,
  },
};
