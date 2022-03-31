const path = require("path");

const scaffold = require("../scaffolding/.eslintrc.ui.js");
const { useTSConfig } = require("../scaffolding/.eslint.utils.js");

const tsPaths = ["./", "cypress"].map((project) =>
  path.join(__dirname, project, "tsconfig.json")
);

module.exports = useTSConfig(
  {
    ...scaffold,
    ignorePatterns: [
      ...scaffold.ignorePatterns,
      "coverage",
      "setupTests.js",
      "nyc-config.js",
      "jest.config.js",
    ],
    rules: {
      ...scaffold.rules,

      // Enforces the use of catch() on un-returned promises
      // Disabled for cypress' PromiseLike syntax (no catch method)
      "promise/catch-or-return": "off",
    },
  },
  tsPaths
);
