import http from "http";

import parseLogs from "./parseLogs";
import writeLogFile from "./writeLogFile";
import { getParams } from "./utils";

/**
 * Collection of all of the logs for this session,
 * keyed by `specname` and further down by `testname`
 */
export interface Logs {
  /**
   * Logs for a given spec (test suite)
   */
  [specname: string]: {
    /**
     * Logs for a spec
     */
    logs: {
      /**
       * Logs for a given test within a spec
       */
      [testname: string]: [string, ...unknown[]][];
    };
    /**
     * When the test is ended and the logs file written,
     * this will turn true to disable further logging to this
     * spec's logs
     */
    closed: boolean;
  };
}

const logs: Logs = {};

const logServer = http.createServer(async (req, res) => {
  // enable calls from the browser
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method.toUpperCase() === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const { method, url } = req;

  const [endpoint, params] = url.split("?");
  console.log("[Request recieved]");
  console.log("[Endpoint]:", endpoint);
  console.log("[Params]:", params);

  // exit early if no params
  // don't fail but send `pong` instead
  if (!params) {
    res.writeHead(200);
    res.end("pong");
    return;
  }

  const { testname, specname } = getParams(params) as {
    testname?: string;
    specname?: string;
  };

  // default functionality, adds log to logs for a given spec and a given test
  if (endpoint === "/log") {
    console.log("Logging...");
    switch (true) {
      // fail early if bad request
      case !testname || !specname || method.toUpperCase() !== "POST":
        res.writeHead(400);
        res.end();
        return;

      // if logs for a `specname` don't exist create new entry
      // intentionally fall through
      case !logs[specname]:
        logs[specname] = {
          logs: {},
          closed: false,
        };

      // if logs aren't closed, add received log to the appropriate test
      // eslint-disable-next-line no-fallthrough
      case !logs[specname].closed:
        const specLogs = logs[specname].logs;
        // create logs entry for a particular test (if one doesn't exist)
        if (!specLogs[testname]) specLogs[testname] = [];

        const logMessage = await parseLogs(req);
        specLogs[testname].push(logMessage);

        const [timestamp, ...message] = logMessage;
        console.log(`[${specname}][${testname}][${timestamp}]`);
        console.log("    ", ...message);

        break;

      // this should only happen if the logs are closed
      // at which point we're not returning a failed response
      // but rather just not writing a new file
      default:
        res.writeHead(200);
        res.end();
        return;
    }
  }

  // end logging and print a logs file for given spec
  if (endpoint === "/end_log") {
    if (!specname) {
      res.writeHead(400);
      res.end();
      return;
    } else if (!Object.keys(logs).includes(specname)) {
      res.writeHead(404);
      res.end();
      return;
    } else {
      // close the logs for future writes
      logs[specname].closed = true;
      const filePath = await writeLogFile(
        logs[specname].logs,
        specname.replace(".ts", "")
      );
      console.log("Log file written: ", filePath);
    }
  }

  res.writeHead(200);
  res.end();
});

// exit gracefully on oudside signal
// such as `fuser -k -SIGINT 8888/tcp`
process.on("SIGINT", () => {
  process.exit();
});

logServer.listen(8888, "localhost", () => {
  console.log("Listening to port 8888 of localhost");
});
