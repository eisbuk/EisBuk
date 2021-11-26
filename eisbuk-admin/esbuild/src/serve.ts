/* eslint-disable @typescript-eslint/no-var-requires */
import { serve } from "esbuild";
import path from "path";

import config from "./lib/config";

import { loadEnv } from "./lib/utils";

import createDevProxy from "./devProxy";

const rootdir = process.cwd();
const servedir = path.join(rootdir, "public");

(async () => {
  // load env variables
  const processEnv = await loadEnv(rootdir, "development");

  // create a dev server (and build) with esbuild
  const {
    host,
    port,
    stop: stopDevServer,
  } = await serve(
    { servedir, host: "localhost" },
    {
      ...config,
      define: { process: processEnv },
      outfile: path.join(servedir, "app", "bundle.js"),
      sourcemap: "inline",
    }
  );

  console.log(`[DEV_SERVER]: Serving static content from ${host}:${port}`);

  // create a proxy server forwarding to dev server
  const devProxy = createDevProxy(host, port);
  devProxy.listen(3000, "localhost", () => {
    console.log(
      `[DEV_PROXY]: Listening to http://localhost:3000 and forwarding requests to dev server (${host}:${port})`
    );
  });

  process.on("SIGINT", () => {
    // stop dev server (freeing up port in use, most often 8000)
    stopDevServer();
    // kill current process (freeing up port 3000)
    process.kill(process.pid);
  });
})();
