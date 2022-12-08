import { DocumentData } from "@google-cloud/firestore";
import pRetry from "p-retry";

import { adminDb } from "@/__testSetup__/firestoreSetup";

interface WaitForConditionParams<D extends DocumentData = DocumentData> {
  documentPath: string;
  condition: (data?: D) => boolean;
  attempts?: number;
  sleep?: number;
  verbose?: boolean;
}

/**
 * Retries to fetch item until condition is true or the max number of attempts exceeded.
 * The firestore instance is read from config (so it doesn't need to be passed in)
 * @param params
 * - documentPath: string path in format `"<collection>/<doc>/<collection>/<doc>"`.
 * Needs to have even number of path nodes (as ons is for `collection` and another for `documentId`)
 * - condition: a function receiving data from requseted document returning boolean condition
 * - attempts: max number of attempts
 * - sleep: pause between attempts
 * @returns
 */
export const waitForCondition = <D extends DocumentData = DocumentData>({
  documentPath,
  condition,
  attempts = 10,
  sleep = 400,
  verbose = false,
}: WaitForConditionParams<D>): Promise<D> => {
  const docId = documentPath.split("/").slice(-1);

  const docRef = adminDb.doc(documentPath);

  return pRetry(
    // Try to fetch the document with provided id in the provided collection
    // until the condition has been met
    async () => {
      const doc = (await docRef.get()).data() as D | undefined;
      // used for debugging
      if (verbose) {
        console.log(doc);
      }
      if (condition(doc)) {
        return Promise.resolve(doc as D);
      }
      return Promise.reject(new Error(`${docId} was not updated successfully`));
    },
    { retries: attempts, minTimeout: sleep, maxTimeout: sleep }
  );
};
