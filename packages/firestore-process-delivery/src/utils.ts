import logger from "./logger";

/**
 * Takes in a function parameter and returns the same function wrapped in a try/catch block
 * @param cb function to wrap in try/catch block
 */
export const wrapErrorBoundary =
  <P extends any[]>(cb: (...params: P) => Promise<void> | void) =>
  async (...params: P): Promise<void> => {
    try {
      await cb(...params);
    } catch (err) {
      logger.error(err);
    }
  };
