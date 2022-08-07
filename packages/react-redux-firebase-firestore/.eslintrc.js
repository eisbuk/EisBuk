const path = require("path");

const scaffold = require("../scaffold/.eslintrc.ui.js");
const { useTSConfig } = require("../scaffold/.eslint.utils.js");

module.exports = useTSConfig(
  {
    ...scaffold,
    ignorePatterns: [
      ...scaffold.ignorePatterns,
      "coverage",
      "setupTests.js",
      "nyc-config.js",
      "jest.config.js",
      "postcss.config.js",
      "tailwind.config.js",
      "src/pages/customer_area_archive/*",
    ],
  },
  [path.join(__dirname, "tsconfig.json")]
);