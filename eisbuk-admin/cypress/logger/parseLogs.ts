import http from "http";
import { StringDecoder } from "string_decoder";

type LogMessage = [string, ...unknown[]];

/**
 * Parses request payload and writes to logs for a given test
 * @param {string} testName for log organization
 * @param {http.IncomingMessage} req request message
 */
export default (req: http.IncomingMessage): Promise<LogMessage> =>
  new Promise<LogMessage>((res) => {
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
        const { message } = JSON.parse(buffer) as { message: unknown[] };
        logMsg = message;
      } catch (err) {
        logMsg = [err];
      }

      res([timestamp, ...logMsg]);
    });
  });
