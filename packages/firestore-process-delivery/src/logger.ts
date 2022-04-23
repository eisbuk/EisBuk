import { logger } from "firebase-functions";

type Logger = Record<
  "log" | "warn" | "info" | "error" | "debug",
  (...message: any[]) => void
>;

const prefix = "[firestore-process-delivery]: ";

export default {
  log: (...message: any[]) => {
    logger.log(prefix, ...message);
  },

  info: (...message: any[]) => {
    logger.info(prefix, ...message);
  },

  warn: (...message: any[]) => {
    logger.warn(prefix, ...message);
  },

  debug: (...message: any[]) => {
    logger.debug(prefix, ...message);
  },

  error: (...message: any[]) => {
    logger.error(prefix, ...message);
  },
} as Logger;
