const defaultConfig = require("../scaffold/tailwind.config.js");

const plugins = [require("@tailwindcss/forms"), ...defaultConfig.plugins];

module.exports = {
  ...defaultConfig,
  plugins,
};
