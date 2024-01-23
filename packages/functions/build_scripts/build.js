#!/usr/bin/env node
/**
 * A `build` script for functions esbuild process.
 * We're using this for building for production and in CI.
 * Additionally the script is made a bit more verbose by analyzing the bundle
 * on successful build.
 */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const esbuild = require("esbuild");

const config = require("./config");

const res = esbuild.buildSync({
  ...config,
  entryPoints: [path.join(__dirname, "..", "src", "index.ts")],
  bundle: true,
  preserveSymlinks: true,
  metafile: true,
  external: [
    "firebase-functions",
    "firebase-admin",
    "uuid",
    "lodash",
    "luxon",
    "@google-cloud/firestore",
  ],
});

const analysis = esbuild.analyzeMetafileSync(res.metafile);
console.log(analysis);
