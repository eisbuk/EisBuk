/**
 * A main config for esbuild build/bundle process.
 * We're importing this in both `build` and `watch` scripts.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

module.exports = {
  entryPoints: [path.join(process.cwd(), "./src/index.ts")],
  outfile: path.join(process.cwd(), "./dist/index.js"),
  platform: "node",
  bundle: true,
  preserveSymlinks: true,
  minify: true,
  metafile: true,
  external: [
    "firebase-functions",
    "firebase-admin",
    "uuid",
    "lodash",
    "luxon",
    "@google-cloud/firestore",
    "",
  ],
};
