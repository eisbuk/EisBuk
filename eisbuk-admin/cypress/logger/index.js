/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require("esbuild");
const path = require("path");
const { fork } = require("child_process");

const { outputFiles } = esbuild.buildSync({
  entryPoints: [path.join(__dirname, "logger.ts")],
  write: false,
  target: "es6",
  format: "cjs",
  platform: "node",
  bundle: true,
  external: ["esbuild", "path", "child_process"],
});

fork("-e", [outputFiles[0].text]);
