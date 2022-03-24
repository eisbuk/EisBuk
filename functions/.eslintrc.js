const scaffold = require("../scaffolding/.eslintrc.js");
const path = require("path");

module.exports = {
  ...scaffold,
  parserOptions: {
    ...scaffold.parserOptions,
    project: path.join(__dirname, "./tsconfig.json"),
  },
  root: true,
  rules: {
    ...scaffold.rules,

    // Removed rule "disallow the use of console" from recommended eslint rules
    "no-console": "warn",

    // Enforces the use of catch() on un-returned promises
    "promise/catch-or-return": 2,

    // Warn against nested then() or catch() statements
    "promise/no-nesting": 1,
  },
  ignorePatterns: [...scaffold.ignorePatterns, "build_scripts"],
};
