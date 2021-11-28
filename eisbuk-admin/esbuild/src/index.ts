import path from "path";

import loadNodeArgs from "./lib/loadNodeArgs";
import { createLogger } from "./lib/utils";
import copyFolder from "./lib/copyFolder";
import outputFileSizes from "./lib/outputFileSizes";

import buildApp from "./build";
import serveDev from "./serve";

/** @TEMP */
const publicPath = path.join(process.cwd(), "public");
const distPath = path.join(process.cwd(), "dist");
/** @TEMP */

/**
 * An entry point for custom bundler built on top of ESBuild.
 * Supports build and serve functionality.
 */
(async () => {
  const logger = createLogger("ROOT");

  const { NODE_ENV, outdir, envPrefix, serve } = loadNodeArgs();

  if (!serve) {
    await Promise.all([
      buildApp({ NODE_ENV, outdir, envPrefix }),
      copyFolder(publicPath, distPath),
    ]);
    logger.log("Build process successfully finished");

    await outputFileSizes(outdir);
  } else {
    await serveDev({ NODE_ENV, envPrefix });
  }
})();
