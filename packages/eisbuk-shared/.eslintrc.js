const path = require("path");

const scaffold = require("../scaffolding/.eslintrc.js");
const { useTSConfig } = require("../scaffolding/.eslint.utils.js");

const tsPaths = [path.join(__dirname, "./tsconfig.json")];

module.exports = useTSConfig(
  {
    ...scaffold,
    ignorePatterns: [...scaffold.ignorePatterns, "build_scripts"],
  },
  tsPaths
);
