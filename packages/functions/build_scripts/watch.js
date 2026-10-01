#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * A `watch` script for functions esbuild process.
 * Compile unbundled functions for development and emulator tests.
 * Pass --once to build without starting a watcher.
 */
const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");

const config = require("./config");

/**
 * Base config we're using for both initial build and `watcher.on("all")`
 */
const baseConfig = {
  ...config,
  sourcemap: true,
};

/**
 * Recursively go through the dir and all subdirs and return all filepaths
 * @param path starting path
 * @returns array of all filenames
 */
const getAllFilenames = (dirName) =>
  fs.readdirSync(dirName).reduce((acc, entryName) => {
    // get full path for file
    const entryPath = path.join(dirName, entryName);
    return fs.statSync(entryPath).isDirectory()
      ? // if directory, get next step result
        [...acc, ...getAllFilenames(entryPath)]
      : // if file, check for extension
      entryName.match(/(.ts|.js)$/)
      ? // if extension match, add to return list
        [...acc, entryPath]
      : // if extension don't match (not js/ts file) ommit from returned list
        acc;
  }, []);

/** BEGIN EXECUTION **/

const src = path.join(__dirname, "..", "src");
const watch = !process.argv.includes("--once");
console.log(`Running compilation${watch ? " in watch mode" : " once"}`);

// create initial build
esbuild.buildSync({
  ...baseConfig,
  entryPoints: getAllFilenames(src),
});

if (watch) {
  console.log(`Watching for file changes in ${src}`);
  // start watcher and rebuild each file on change
  const watcher = chokidar.watch(`${src}/**/*.(js|ts)`, {
    ignoreInitial: true,
  });
  watcher.on("all", (e, fp) => {
    if (e !== "unlink") {
      esbuild.build({ ...baseConfig, entryPoints: [fp] });
    }
  });
}
