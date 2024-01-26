import functions from "firebase-functions";

/**
 * A fallback function used during e2e tests to simplify the running environment.
 */
export const skippedDataTrigger =
  (name: string, dataSelector: (data?: Record<string, any>) => any) =>
  (change: functions.Change<functions.firestore.DocumentSnapshot>) => {
    const payload = dataSelector(change.after.data());
    functions.logger.info("This dataTrigger is skipped in CI", name, payload);
  };
