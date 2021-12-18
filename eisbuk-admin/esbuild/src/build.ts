import { build } from "esbuild";
import path from "path";

import config from "./lib/config";
import { BuildParams } from "./lib/types";

import { createLogger } from "./lib/utils";

/**
 * Performs the (async) `esbuild` powered bundling process of our app
 * with provided config.
 */
export default async ({ outdir, processEnv }: BuildParams): Promise<void> => {
  const logger = createLogger("BUILD_APP");

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
