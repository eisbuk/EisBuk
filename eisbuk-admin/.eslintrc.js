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
  },
  tsPaths
);
