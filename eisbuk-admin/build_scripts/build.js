/**
 * A main config for esbuild build/bundle process.
 * We're importing this in both `build` and `watch` scripts.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const esbuild = require("esbuild");
const fs = require("fs");
const dotenv = require("dotenv");

const svgr = require("esbuild-plugin-svgr");

const public = path.join(__dirname, "..", "public");
const src = path.join(__dirname, "..", "src");
const dist = path.join(__dirname, "..", "dist");

/**
 * Searches for `.env` file and `.env.${NODE_ENV}.local` files.
 * If env file(s) found, returns an object populated with env variables (including `NODE_ENV`),
 * to be used as `process.env`, if files are empty/not-found, the return object contains only `NODE_ENV`.
 *
 * @param {string} nodeEnv `"development"`, `"test"` or `"production"`, if not specified (or invalid), falls back to "development"
 * @returns `process.env` object
 */
const loadEnv = async (nodeEnv) => {
  const nodeEnvWhitelist = ["development", "test", "production"];

  const nodeEnvInvalid =
    typeof nodeEnv !== "string" || !nodeEnvWhitelist.includes(nodeEnv);

  let NODE_ENV;

  if (!nodeEnv) {
    NODE_ENV = "development";
    console.log('NODE_ENV not specified, using "development" as default');
  } else if (nodeEnvInvalid) {
    NODE_ENV = "development";
    console.log('Invalid value for NODE_ENV, using "development" as default');
  } else {
    NODE_ENV = nodeEnv;
    console.log(`Using provided value for NODE_ENV: "${NODE_ENV}"`);
  }

  let env = { NODE_ENV };

  // the env variables are loaded in this order so that specific `.env.${NODE_ENV}.local`
  // file can take presedence (overwrite vars present in both of the files)
  [".env", `.env.${NODE_ENV}.local`].forEach((fName) => {
    const pathToFile = path.join(__dirname, "..", fName);

    try {
      // load env file
      const envFile = fs.readFileSync(pathToFile);
      // parse env file to extract vars as object
      const envVars = dotenv.parse(envFile);
      env = { ...env, ...envVars };
    } catch {
      //
    }
  });

  return env;
};

/**
 * Performs the (async) `esbuild` powered bundling process of our app
 * with provided config.
 */
const buildApp = async () => {
  // load env vars to be bundled in the code
  const process = JSON.stringify({ env: await loadEnv("production") });

  esbuild.build({
    define: { process },
    plugins: [svgr()],
    entryPoints: [path.join(src, "index.tsx")],
    bundle: true,
    outfile: path.join(dist, "app", "bundle.js"),
    write: true,
    minify: true,
    sourcemap: true,
    metafile: true,
    target: "es6",
    format: "cjs",
  });
};

/**
 * Uses (async) `fs.copyFile` to copy the contents of `/public` folder
 * to the `/dist` folder, ready for deployment
 */
const copyPublicToDist = async () => {
  const pFiles = fs.readdirSync(public);

  return Promise.all(
    pFiles.map((fName) => {
      const pathToFile = path.join(public, fName);
      const distFilePath = path.join(dist, fName);
      return fs.copyFile(pathToFile, distFilePath, (err) => {
        if (err) throw err;
        console.log(`Copied ${pathToFile} to '/dist' folder for deployment`);
      });
    })
  );
};

/**
 * Main execution
 */
(async () => {
  await Promise.all([buildApp(), copyPublicToDist()]);
})();
