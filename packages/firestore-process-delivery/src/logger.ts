import { logger } from "firebase-functions";

type Logger = Record<
  "log" | "warn" | "info" | "error" | "debug",
  (...message: any[]) => void
>;

const prefix = "[firestore-process-delivery]: ";

const verbose = process.env.LOG_LEVEL === "verbose";

/**
 * A logger created by prefixing each method with the given prefix and
 * applying the log level: if verbose, all logs are written, if not, only
 * the errors get written out.
 */
const finalLogger: Logger = ["log", "info", "warn", "debug", "error"].reduce(
  (acc, method) => ({
    ...acc,
    [method]: (...message: any[]) =>
      // eslint-disable-next-line import/namespace
      verbose || method === "error" ? logger[method](prefix, ...message) : {},
  }),
  {} as Logger
);

export default finalLogger;
