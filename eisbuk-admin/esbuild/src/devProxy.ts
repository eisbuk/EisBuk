import http from "http";

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

export default (targetHost: string, targetPort: number): http.Server =>
  http.createServer(createProxyListener(targetHost, targetPort));

// #region utils
const endWithStatusCode = (res: http.ServerResponse, statusCode: number) => {
  res.writeHead(statusCode);
  res.end();
};
// #endregion utils
