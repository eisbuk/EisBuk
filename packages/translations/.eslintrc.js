const path = require("path");

const scaffold = require("../scaffold/.eslintrc.ui.js");
const { useTSConfig } = require("../scaffold/.eslint.utils.js");

const tsPaths = [path.join(__dirname, "./tsconfig.json")];

module.exports = useTSConfig(scaffold, tsPaths);
