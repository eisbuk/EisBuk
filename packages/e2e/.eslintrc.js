const path = require("path");

const scaffold = require("../scaffold/.eslintrc.ui.js");
const { useTSConfig } = require("../scaffold/.eslint.utils.js");

module.exports = useTSConfig(
  {
    ...scaffold,
    ignorePatterns: [...scaffold.ignorePatterns, "coverage", "reports"],
    rules: {
      ...scaffold.rules,

      // Enforces the use of catch() on un-returned promises
      // Disabled for cypress' PromiseLike syntax (no catch method)
      "promise/catch-or-return": "off",

      // We're using namespaces to extend cypress namespace in order to
      // declare cy[command] interfaces
      "@typescript-eslint/no-namespace": "off",
    },
  },
  [path.join(__dirname, "tsconfig.json")]
);
