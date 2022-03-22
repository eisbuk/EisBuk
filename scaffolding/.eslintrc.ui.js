const scaffold = require("./.eslintrc.js");

module.exports = {
  ...scaffold,
  extends: [
    ...scaffold.extends,
    "plugin:import/react",
    "plugin:react-hooks/recommended",
  ],
};
