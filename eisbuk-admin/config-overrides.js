/* eslint-disable react-hooks/rules-of-hooks */
const { useBabelRc, override } = require("customize-cra");
const { alias, configPaths } = require("react-app-rewire-alias");

module.exports = override(
  // use custom babel config
  useBabelRc(),

  // add aliases for cleaner imports
  alias(configPaths("./tsconfig.paths.json"))
);
