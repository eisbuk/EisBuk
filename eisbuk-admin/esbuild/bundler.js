/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require("esbuild");
const path = require("path");
const { fork } = require("child_process");

// build bundler from `/src` and keep in memory
const { outputFiles } = esbuild.buildSync({
  entryPoints: [path.join(__dirname, "src", "index.ts")],
  platform: "node",
  target: "es6",
  format: "cjs",
  bundle: true,
  write: false,
  minify: true,
  tsconfig: path.join(__dirname, "tsconfig.json"),
  external: ["esbuild", "path", "fs", "esbuild-plugin-svgr"],
});

// run the bundler from memory in a child process
const bundler = outputFiles[0].text;
// bundler expects first two `process.argv` args to be process call
// and processes the args from 3rd on
// here we're adding additional arg (call to a child process), so
// we're slicing one arg from this process
const child = fork("-e", [bundler, ...process.argv.slice(1)], {
  detached: false,
});

child.on("close", (code) => {
  // Our exit code should be the same as the bundler
  // TODO the bundler exits with code 0 even in case of errors
  process.exitCode = code;
});
