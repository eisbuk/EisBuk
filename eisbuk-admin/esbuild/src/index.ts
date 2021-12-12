import path from "path";

import loadNodeArgs from "./lib/loadNodeArgs";
import { createLogger } from "./lib/utils";
import copyFolder from "./lib/copyFolder";
import outputFileSizes from "./lib/outputFileSizes";

import buildApp from "./build";
import serveDev from "./serve";

const publicPath = path.join(process.cwd(), "public");

/**
 * An entry point for custom bundler built on top of ESBuild.
 * Supports build and serve functionality.
 */
(async () => {
  const logger = createLogger("ROOT");

  const { NODE_ENV, distpath, envPrefix, serve } = loadNodeArgs();

  // out dir of bundle (js and css) files
  const outdir = path.join(distpath, "app");
  // build app for appropriate env functionality: build/serve
  await copyFolder(publicPath, distpath);

  if (!serve) {
    await buildApp({
      NODE_ENV,
      outdir,
      envPrefix,
    });
    logger.log("Build process successfully finished");
    await outputFileSizes(outdir);
  } else {
    await serveDev({ NODE_ENV, outdir, envPrefix, servedir: distpath });
  }
})();
