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
const buildApp = async ({
  NODE_ENV,
  envPrefix,
  outdir,
}: ReturnType<typeof loadNodeArgs>) => {
  const logger = createLogger("BUILD_APP");

  // load env vars to be bundled in the code
  logger.log(`Loading env variables in mode "${NODE_ENV}"`);
  const processEnv = await loadEnv(process.cwd(), NODE_ENV, envPrefix);

  // bundle the app
  logger.log("Creating an optimized production build...");
  await build({
    ...config,
    define: { process: processEnv },
    outfile: path.join(outdir, "bundle.js"),
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
 * Scans
 */
const outputBundleSize = async (dirpath: string): Promise<void> => {
  console.log("");
  console.log("File sizes after bundle finished:");
  console.log("");
  await new Promise<void>((res) =>
    fs.readdir(dirpath, (err, fNames) => {
      if (err) throw err;
      fNames.forEach((fName) => {
        const fullPath = path.join(dirpath, fName);
        const relPath = path.relative(process.cwd(), fullPath);

        const { size } = fs.statSync(fullPath);

        const indent = 12;
        const kb = Math.floor(size / 1000);
        const b = Math.floor(size % 1000);
        const sizeString = `${kb}.${b} KB`;
        const wsLen = indent - sizeString.length;
        const whitespace = " ".repeat(wsLen);

        console.log(`${sizeString}${whitespace}${relPath}`);
      });
      res();
    })
  );
  console.log("");
};

/**
 * Main execution
 */
(async () => {
  const buildArgs = loadNodeArgs();
  await Promise.all([buildApp(buildArgs), copyPublicFiles()]);
  createLogger("BUILD").log("Build process successfully finished");
  await outputBundleSize(buildArgs.outdir);
})();
