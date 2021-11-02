import {
  DocumentReference,
  Firestore,
  DocumentData,
} from "@google-cloud/firestore";
import pRetry from "p-retry";

import { Customer, CustomerBase } from "eisbuk-shared";

import { adminDb } from "@/__testSettings__";

interface WaitForCondition {
  (params: {
    documentPath: string;
    condition: (data: DocumentData | undefined) => boolean;
    attempts?: number;
    sleep?: number;
    verbose?: boolean;
  }): Promise<DocumentData | undefined>;
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
export const waitForCondition: WaitForCondition = async ({
  documentPath,
  condition,
  attempts = 10,
  sleep = 400,
  verbose = false,
}) => {
  const docId = documentPath.split("/").slice(-1);

  const document = getDocumentRef(adminDb, documentPath);

  return await pRetry(
    // Try to fetch the document with provided id in the provided collection
    // until the condition has been met
    async () => {
      const doc = (await document.get()).data();
      // used for debugging
      if (verbose) {
        console.log(doc);
      }
      if (condition(doc)) {
        return Promise.resolve(doc);
      }
      return Promise.reject(new Error(`${docId} was not updated successfully`));
    },
    { retries: attempts, minTimeout: sleep, maxTimeout: sleep }
  );
};
/**
 * Recursively goes through all of the levels of firestore
 * record tree and returns a reference to final document from string path passed in.
 *
 * @param accRef accumulated path:
 * - on top level call, used to pass `firestore` instance
 * - on each recursive call, the next `collection().doc()` reference gets chained to existing value and gets passed down
 * to subsequent recursive call
 * @param pathToDoc full path to the document in "collection"/"docuemntId" pairs chained together (separated by "/")
 * i.e. `"<top-level-collection>/<doc>/<level-1-subcollection>/<doc>/<level-2-subcollection>/<doc>"`
 *
 * Example
 * ```
 * getFirestoreData(db, "organizations/default/attendance/2021-08")
 *
 * // returns reference to
 * db
 *  .collection("organizations")
 *  .doc("default")
 *  .collection("attendance")
 *  .doc("2021-08")
 * ```
 */
export const getDocumentRef = (
  accRef: DocumentReference | Firestore,
  pathToDoc: string
): DocumentReference => {
  const collectionsToDoc = pathToDoc.split("/");

  // if we've reached a target document node, return document reference
  if (collectionsToDoc.length === 2) {
    const [coll, doc] = collectionsToDoc;
    return accRef.collection(coll).doc(doc);
  }

  // we're taking first collection/documentId tuple from string path
  // and passing the rest further
  const [coll, doc] = collectionsToDoc.splice(0, 2);
  return getDocumentRef(
    accRef.collection(coll).doc(doc) as DocumentReference,
    collectionsToDoc.join("/")
  );
};

// #region customer
/**
 * A helper function used to remove `id` and `secretKey`
 * from customer structure for testing purposes
 * @param customer full customer entry
 * @returns customer entry withour `secretKey` and `id`
 */
export const stripIdAndSecretKey = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  id: _id,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  secretKey: _secretKey,
  ...customer
}: Customer): Omit<Omit<Customer, "id">, "secretKey"> => customer;
/**
 * A helper function used to strip excess customer data
 * and create customer base data (used to test `booking` entry for customer)
 * @param customer customer entry (without `secretKey` for convenient testing)
 * @returns customer base structure
 */
export const getCustomerBase = ({
  id,
  name,
  surname,
  category,
}: Omit<Customer, "secretKey">): CustomerBase => ({
  id,
  name,
  surname,
  category,
});
// #endregion customer
