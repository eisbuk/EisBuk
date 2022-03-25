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
    "coverage/",
    "setupTests.js",
    "nyc-config.js",
    "jest.config.js",
  ],
  rules: {
    ...scaffold.rules,
  },
};
