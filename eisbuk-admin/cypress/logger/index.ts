import http from "http";
import { StringDecoder } from "string_decoder";

import writeLogFile from "./writeLogFile";

const logs: Record<string, [string, ...unknown[]][]> = {};

const logServer = http.createServer(async (req, res) => {
  const { method, url } = req;

  const [endpoint, params] = url.split("?");

  if (params) {
    const { testname } = getParams(params) as { testname?: string };

    // default functionality
    if (testname && method.toUpperCase() === "POST") {
      await addLog(testname, req);
    }
  }

  if (endpoint === "/end_log") {
    await writeLogFile(logs, "test_spec");
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.writeHead(200);
  res.end();
});

/**
 * Get params as key/value from url params string
 * @param {string} params url params string (separated by "&" char)
 * @returns {object} params record
 */
const getParams = (url: string) =>
  url
    // split params
    .split("&")
    // return params as key/value pairs
    .reduce((acc, param) => {
      //   console.log("Param >", param);
      const [key, value] = param.split("=");
      return { ...acc, [key]: value };
    }, {});

/**
 * Parses request payload and writes to logs for a given test
 * @param {string} testName for log organization
 * @param {http.IncomingMessage} req request message
 */
const addLog = (testName: string, req: http.IncomingMessage) =>
  new Promise<void>((res) => {
    // timestamp each log
    const timestamp = new Date(Date.now())
      .toISOString()
      .replace(/[-0-9]*T/, "")
      .substr(0, 8);

    // parse log msg and add to logs
    const decoder = new StringDecoder("utf-8");
    let buffer = "";
    req.on("data", (chunk) => {
      buffer += decoder.write(chunk);
    });
    req.on("end", () => {
      buffer += decoder.end();

      let logMsg: unknown[];
      try {
        const { message } = JSON.parse(buffer) as { message: string[] };
        logMsg = message;
      } catch (err) {
        logMsg = [err];
      }

      if (!logs[testName]) {
        logs[testName] = [];
      }

      // add log message (or error) to tests
      logs[testName].push([timestamp, ...logMsg]);

      res();
    });
  });

logServer.listen(8888, "localhost", () => {
  console.log("Listening to port 8888 of localhost");
});
