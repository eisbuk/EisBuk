import { build, serve } from "esbuild";
import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

import { ServeParams } from "./lib/types";

import { createLogger } from "./lib/utils";
import config from "./lib/config";
import loadEnv from "./lib/loadEnv";

import createDevProxy from "./devProxy";

/**
 * Clients listening to dev server SSE
 */
const clients: http.ServerResponse[] = [];

const addClient = (res: http.ServerResponse) => {
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
  hotReload,
}: ServeParams): Promise<void> => {
  const processEnv = await loadEnv(process.cwd(), NODE_ENV, envPrefix);

  // create a development build
  build({
    ...config,
    define: { process: processEnv },
    outfile: path.join(outdir, "bundle.js"),
    sourcemap: true,
    watch: {
      onRebuild:
        // send SSE rebuild signal to each of the clients on rebuild
        // if `hotReload` disabled, this will have no effect
        () => {
          // send update signal to each client
          clients.forEach((res) => res.write("data: update\n\n"));
          // reset clients (as each will subscribe again on update)
          clients.length = 0;
        },
    },

    // add hot reload option if
    ...(hotReload
      ? {
          banner: {
            // add the following script to the top of our bundle in order to subscribe to dev server
            // for reload SSE message
            js: `(() => new EventSource("/hmr").onmessage = () => location.reload())();`,
          },
        }
      : {}),
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
  await createDevProxy({
    targetHost,
    targetPort,
    listenPort: 3000,
    addClient,
  });

  // open the default browser only if it is not opened yet
  const tryToOpenBrowser = () => {
    // Make a request to the build server to verify it's up and running,
    // and ready to serve requests.
    const options: http.RequestOptions = {
      hostname: targetHost,
      port: targetPort,
      path: "/app/bundle.js",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        // The bundle URL returns a 404: it's not ready yet.
        setTimeout(tryToOpenBrowser, 10);
      } else {
        // The bundle URL returns a 200: it's ready.
        const endTime = Date.now();
        // Print the difference between start and end in seconds
        console.log(
          `Build server ready in ${(endTime - startTime) / 1000} seconds`
        );
        const open = {
          darwin: ["open"],
          linux: ["xdg-open"],
          win32: ["cmd", "/c", "start"],
        } as Record<NodeJS.Platform, string[]>;
        const ptf = process.platform;
        if (clients.length === 0) {
          spawn(open[ptf][0], [...open[ptf].slice(1), `http://localhost:3000`]);
        }
      }
    });
    req.end();
  };
  const startTime = Date.now();
  setTimeout(tryToOpenBrowser, 10);

  process.on("SIGINT", () => {
    stopDevServer();
    fs.rmSync(servedir, { recursive: true });
    process.exit();
  });
};
