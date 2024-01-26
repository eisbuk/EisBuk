/**
 * A main config for esbuild build/bundle process.
 * We're importing this in both `build` and `watch` scripts.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

module.exports = {
  outdir: path.join(__dirname, "..", "dist"),
  platform: "node",
  write: true,
  format: "cjs",
  minify: false,
  sourcemap: true,
};
