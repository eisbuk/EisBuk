import http from "http";
import { createLogger } from "./lib/utils";

/**
 * A HOF used to create a root listener for proxy server
 * @param targetHost final destination `hostname` of forwarded request
 * @param targetPort final destination `port` of forwarded request
 */
const createProxyListener =
  (targetHost: string, targetPort: number): http.RequestListener =>
  async (req, res) => {
    // fail early if the `req.url` is not defined
    if (!req.url) return endWithStatusCode(res, 400);

    const forwardReq = (path: string) => {
      const options: http.RequestOptions = {
        host: targetHost,
        port: targetPort,
        path,
        method: req.method,
        headers: req.headers,
      };

      // create a request for final destination (dev server)
      const proxyReq = http.request(options, (proxyRes) => {
        console.log("Recieved res from dev server > ", proxyRes.statusCode);

        switch (proxyRes.statusCode) {
          case undefined:
            // this shouldn't happen and indicates an internal error
            return endWithStatusCode(res, 500);
          case 404:
            // if we're already on fallback path, stop recursion and return 404
            if (path === "/") return endWithStatusCode(res, 404);
            // try a request with fallback path
            return forwardReq("/");
          default:
            // everything is good, pipe the proxyRes back to res for the client
            return proxyRes.pipe(res, { end: true });
        }
      });

      // pipe requests through to dev server
      req.pipe(proxyReq, { end: true });
    };

    return forwardReq(req.url!);
  };

interface DevServerArgs {
  targetHost: string;
  targetPort: number;
  listenPort: number;
}

export default ({
  targetHost,
  targetPort,
  listenPort,
}: DevServerArgs): Promise<void> => {
  const proxy = http.createServer(createProxyListener(targetHost, targetPort));

  return new Promise<void>((res) =>
    proxy.listen(listenPort, "localhost", () => {
      createLogger("DEV_PROXY").log(
        `Listening to http://localhost:${listenPort} and forwarding requests to dev server (${targetHost}:${targetPort})`
      );
      res();
    })
  );
};

// #region utils
const endWithStatusCode = (res: http.ServerResponse, statusCode: number) => {
  res.writeHead(statusCode);
  res.end();
};
// #endregion utils
