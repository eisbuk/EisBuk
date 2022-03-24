const scaffold = require("../scaffolding/.eslintrc.ui.js");
const path = require("path");

const tsPaths = ["./", "esbuild", "cypress"].map((project) =>
  path.join(__dirname, project, "tsconfig.json")
);

module.exports = {
  ...scaffold,
  parserOptions: {
    ...scaffold.parserOptions,
    project: tsPaths,
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
