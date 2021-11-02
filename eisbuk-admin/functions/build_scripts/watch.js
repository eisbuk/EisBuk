/**
 * A `watch` script for functions esbuild process.
 * We're using this to create a bundle and watch for changes (for development and tests).
 * The config is the same as for the `build` process with the difference of watch mode and
 * the script being less verbose (not to overclutter the console on rebuilds)
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require("esbuild");
const config = require("./config");
(async () => {
  await esbuild.build({ ...config, watch: true });
})();
