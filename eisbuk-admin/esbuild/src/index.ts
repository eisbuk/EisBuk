import path from "path";

import loadNodeArgs from "./lib/loadNodeArgs";
import { createLogger } from "./lib/utils";
import copyFolder from "./lib/copyFolder";
import outputFileSizes from "./lib/outputFileSizes";

import buildApp from "./build";
import serveDev from "./serve";
import { Mode } from "./lib/enums";
import loadEnv from "./lib/loadEnv";

/**
 * An entry point for custom bundler built on top of ESBuild.
 * Supports build and serve functionality.
 */
(async () => {
  const logger = createLogger("ROOT");

  const {
    NODE_ENV,
    DEPLOY_STAGE,
    distpath,
    envPrefix,
    mode,
    hotReload,
    publicpath,
  } = loadNodeArgs();

  // load env vars to be bundled in the code
  const processEnv = await loadEnv({
    rootPath: process.cwd(),
    NODE_ENV,
    DEPLOY_STAGE,
    envPrefix,
  });

  // out dir of bundle (js and css) files
  const outdir = path.join(distpath, "app");
  // build app for appropriate env functionality: build/serve
  await copyFolder(publicpath, distpath);

  if (mode === Mode.Build) {
    await buildApp({ outdir, processEnv });
    logger.log("Build process successfully finished");
    await outputFileSizes(outdir);
  } else {
    await serveDev({
      outdir,
      servedir: distpath,
      hotReload,
      processEnv,
    });
  }
})();
