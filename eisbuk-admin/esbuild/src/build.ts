import { build } from "esbuild";
import path from "path";
import fs from "fs";

import config from "./lib/config";
import loadEnv from "./lib/loadEnv";
import loadNodeArgs from "./lib/loadNodeArgs";
import { createLogger } from "./lib/utils";

const publicPath = path.join(process.cwd(), "public");
const distPath = path.join(process.cwd(), "dist");

/**
 * Performs the (async) `esbuild` powered bundling process of our app
 * with provided config.
 */
const buildApp = async () => {
  const logger = createLogger("BUILD_APP");

  const args = loadNodeArgs();

  // check nodeEnv and fallback to "development" if needed
  let NODE_ENV = "development";
  const nodeEnvWhitelist = ["development", "test", "storybook", "production"];

  const nodeEnvInvalid =
    typeof args.mode !== "string" || !nodeEnvWhitelist.includes(args.mode);

  if (!args.mode) {
    logger.log(`NODE_ENV not specified, using "${NODE_ENV}" as default`);
  } else if (nodeEnvInvalid) {
    logger.log(`Invalid value for NODE_ENV, using "${NODE_ENV}" as default`);
  } else {
    NODE_ENV = args.mode;
    logger.log(`Using provided value for NODE_ENV: "${NODE_ENV}"`);
  }

  // check for env variable prefix and fall back to "REACT_APP" if not defined
  let envPrefix = "REACT_APP";
  if (!args.envPrefix) {
    logger.log(`No --env-prefix specified, falling back to ${envPrefix}`);
  } else {
    envPrefix = args.envPrefix;
  }

  // load env vars to be bundled in the code
  logger.log(`Loading env variables in mode "${NODE_ENV}"`);
  const processEnv = await loadEnv(process.cwd(), NODE_ENV, envPrefix);

  // bundle the app
  logger.log("Creating an optimized production build...");
  build({
    ...config,
    define: { process: processEnv },
    outfile: path.join(distPath, "app", "bundle.js"),
    write: true,
    minify: true,
    sourcemap: true,
    metafile: true,
  });

  logger.log("Build process successfully finished");
};

/**
 * Uses (async) `fs.copyFile` to copy the contents of `/public` folder
 * to the `/dist` folder, ready for deployment
 */
const copyPublicFiles = async () => {
  const logger = createLogger("COPY_PUBLIC_FILES");

  logger.log(`Looking for public files in ${publicPath}`);
  const pFiles = fs.readdirSync(publicPath);
  logger.log("/public folder found");
  logger.log(`Copying public files to ${distPath}`);

  // create a `/dist` folder if one doesn't already exist
  try {
    // convert `fs.mkdir` to promise to prevent race condition
    // with single file copy/paste flow
    await new Promise<void>((res) =>
      fs.mkdir(distPath, () => {
        logger.log(`No ${distPath} folder found, created new`);
        res();
      })
    );
  } catch (err) {
    logger.error(err);
  }

  // copy all files from `/public` to `/dist` folder
  return Promise.all(
    pFiles.map((fName) => {
      const pathToFile = path.join(publicPath, fName);
      const distFilePath = path.join(distPath, fName);

      // return promise resolved inside `fs.copyFile` callback
      // in order to be able to await on resolution
      return new Promise<void>((res) =>
        fs.copyFile(pathToFile, distFilePath, (err) => {
          if (err) throw err;
          logger.log(`Copied ${pathToFile} to '/dist' folder for deployment`);
          res();
        })
      );
    })
  );
};

/**
 * Main execution
 */
(async () => {
  await Promise.all([buildApp(), copyPublicFiles()]);
  createLogger("BUILD").log("Build process successfully finished");
})();
