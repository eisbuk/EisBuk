"use strict";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const istanbulJSSchema = require("@istanbuljs/schema");

const { parserPlugins } = istanbulJSSchema.defaults.nyc;

module.exports = {
  cache: false,
  parserPlugins: parserPlugins.concat("typescript", "jsx"),
};
