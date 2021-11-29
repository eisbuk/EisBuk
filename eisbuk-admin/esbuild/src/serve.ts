/* eslint-disable @typescript-eslint/no-var-requires */
import { serve } from "esbuild";
import path from "path";

import { CLIArgs } from "./lib/types";

import config from "./lib/config";
import loadEnv from "./lib/loadEnv";
import { createLogger } from "./lib/utils";

import createDevProxy from "./devProxy";

const rootdir = process.cwd();
const servedir = path.join(rootdir, "public");

export default async ({
  NODE_ENV,
  envPrefix,
}: Omit<Omit<CLIArgs, "serve">, "outdir">): Promise<void> => {
  // load env variables
  const processEnv = await loadEnv(rootdir, NODE_ENV, envPrefix);

  // create a dev server (and build) with esbuild
  const {
    host: targetHost,
    port: targetPort,
    stop: stopDevServer,
  } = await serve(
    { servedir, host: "localhost" },
    {
      ...config,
      define: { process: processEnv },
      outfile: path.join(servedir, "app", "bundle.js"),
      sourcemap: "inline",
      minify: true,
    }
  );

  createLogger("DEV_SERVER").log(
    `Serving static content from ${targetHost}:${targetPort}`
  );

  // create a proxy server forwarding to dev server
  createDevProxy({ targetHost, targetPort, listenPort: 3000 });

  process.on("SIGINT", () => {
    // stop dev server (freeing up port in use, most often 8000)
    stopDevServer();
    // kill current process (freeing up port 3000)
    process.kill(process.pid);
  });
};
