import { build, BuildOptions } from "esbuild";
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
    ...getConfigOverrides(),
  });

  logger.log("Build process successfully finished");
};

/**
 * Get config overrides for specific use cases (i.e. coverage CI run)
 * @returns overrides in form of `BuildParams`, empty object if no overrides
 */
const getConfigOverrides = (): Partial<BuildOptions> => {
  const logger = createLogger("CONFIG_OVERRIDES");

  // case of coverage flow, override `entryPoints` and `tsconfig`
  if (process.env.USE_INSTRUMENTED) {
    logger.log("USE_INSTRUMENTED=true, using coverage config overrides");

    // for coverage purposes, the `instrumented` folder will contain our source files
    const entryPoints = [path.join(process.cwd(), "instrumented", "index.tsx")];
    logger.log(`Entry point: ${entryPoints[0]}`);

    // for bundler's ability to resolve "@" path prefix to `instrumented` rather than `src`
    // we're using a specific `tsconfig.coverage.json`
    const tsconfig = path.join(process.cwd(), "tsconfig.coverage.json");
    logger.log(`TSConfig: ${tsconfig}`);

    return { entryPoints, tsconfig };
  }

  // no overrides, return empty object
  return {};
};
