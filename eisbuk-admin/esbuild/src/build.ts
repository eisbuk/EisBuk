import { build } from "esbuild";
import path from "path";
import fs from "fs";

import { loadEnv } from "./lib/utils";

import config from "./lib/config";

const publicPath = path.join(process.cwd(), "public");
const distPath = path.join(process.cwd(), "dist");

/**
 * Performs the (async) `esbuild` powered bundling process of our app
 * with provided config.
 */
const buildApp = async () => {
  // load env vars to be bundled in the code
  const processEnv = await loadEnv(process.cwd(), "production");

  build({
    ...config,
    define: { process: processEnv },
    outfile: path.join(distPath, "app", "bundle.js"),
    write: true,
    minify: true,
    sourcemap: true,
    metafile: true,
  });
};

/**
 * Uses (async) `fs.copyFile` to copy the contents of `/public` folder
 * to the `/dist` folder, ready for deployment
 */
const copyPublicToDist = async () => {
  const pFiles = fs.readdirSync(publicPath);

  // create a `/dist` folder if one doesn't already exist
  try {
    fs.mkdir(distPath, () => {
      console.log(`No ${distPath} folder found, created new`);
    });
  } catch (err) {
    console.error(err);
  }

  // copy all files from `/public` to `/dist` folder
  return Promise.all(
    pFiles.map((fName) => {
      const pathToFile = path.join(publicPath, fName);
      const distFilePath = path.join(distPath, fName);
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
