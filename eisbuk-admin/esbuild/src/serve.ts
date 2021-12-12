import { build, serve } from "esbuild";
import { ServerResponse } from "http";
import fs from "fs";
import path from "path";

import { createLogger } from "./lib/utils";
import config from "./lib/config";
import loadEnv from "./lib/loadEnv";

import { BuildParams } from "./build";
import createDevProxy from "./devProxy";

/**
 * Clients listening to dev server SSE
 */
const clients: ServerResponse[] = [];

const addClient = (res: ServerResponse) => {
  clients.push(
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    })
  );
};

export default async ({
  NODE_ENV,
  envPrefix,
  outdir,
  servedir,
}: BuildParams & { servedir: string }): Promise<void> => {
  const processEnv = await loadEnv(process.cwd(), NODE_ENV, envPrefix);

  // create a development build
  build({
    ...config,
    define: { process: processEnv },
    outfile: path.join(outdir, "bundle.js"),
    sourcemap: true,
    banner: {
      js: `(() => new EventSource("/hmr").onmessage = () => location.reload())();`,
    },
    watch: {
      onRebuild:
        // send SSE rebuild signal to each of the clients on rebuild
        () => {
          // send update signal to each client
          clients.forEach((res) => res.write("data: update\n\n"));
          // reset clients (as each will subscribe again on update)
          clients.length = 0;
        },
    },
  });

  // create a dev server with esbuild
  const {
    host: targetHost,
    port: targetPort,
    stop: stopDevServer,
  } = await serve({ servedir, host: "localhost" }, {});

  createLogger("DEV_SERVER").log(
    `Serving static content from ${targetHost}:${targetPort}`
  );

  // create a proxy server forwarding to dev server and sending
  createDevProxy({
    targetHost,
    targetPort,
    listenPort: 3000,
    addClient,
  });

  process.on("SIGINT", () => {
    stopDevServer();
    fs.rmSync(servedir, { recursive: true });
    process.exit();
  });
};
