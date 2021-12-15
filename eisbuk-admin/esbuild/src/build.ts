import { build } from "esbuild";
import path from "path";

import { BuildParams } from "./lib/types";
import config from "./lib/config";

import loadEnv from "./lib/loadEnv";
import { createLogger } from "./lib/utils";

/**
 * Performs the (async) `esbuild` powered bundling process of our app
 * with provided config.
 */
export default async ({
  NODE_ENV,
  envPrefix,
  outdir,
}: BuildParams): Promise<void> => {
  const logger = createLogger("BUILD_APP");

  // load env vars to be bundled in the code
  const processEnv = await loadEnv(process.cwd(), NODE_ENV, envPrefix);

  // bundle the app
  logger.log("Creating an optimized production build...");
  await build({
    ...config,
    define: { process: processEnv },
    outfile: path.join(outdir, "bundle.js"),
    sourcemap: true,
  });

  logger.log("Build process successfully finished");
};
