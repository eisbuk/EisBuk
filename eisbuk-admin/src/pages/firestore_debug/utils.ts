import {
  deleteDoc as delDoc,
  getDoc,
  setDoc,
  doc,
  getFirestore,
} from "@firebase/firestore";

import { FirestoreThunk } from "@/types/store";

/**
 * A helper function we're using to test string serialized record/array if parsable JSON objects
 */
export const testJSON = (serialized: string | undefined): boolean => {
  try {
    JSON.parse(serialized!);
    return true;
  } catch {
    return false;
  }
};

/**
 * Base params for DispatchFB function (get's extended with `docValues` for "submit" variant)
 */
export interface DispatchFSBaseParams {
  docPath: string;
  /**
   * Optional string used for more precise console log message.
   * Defaults to "document"
   */
  docType?: string;
}

/**
 * Function interface for function we're using to dispatch create/delete
 * action to firestore (for rules testing/debug)
 */
interface DispatchFS<T extends "submit" | "delete"> {
  (
    params: T extends "submit"
      ? DispatchFSBaseParams & {
          /**
           * Values for document to add to store
           */
          docValues: Record<string, any>;
        }
      : DispatchFSBaseParams
  ): FirestoreThunk;
}

/**
 * A handler we're using to create a Thunk for dispatching of create/update
 * of given document to firestore
 */
export const submitDoc: DispatchFS<"submit"> = ({
  docPath,
  docValues,
  docType = "document",
}) => async () => {
  const docRef = doc(getFirestore(), docPath);

  // try and set updated document in firestore
  await setDoc(docRef, docValues);

  // check updated document and log to console
  const updatedDoc = (await getDoc(docRef)).data();

  console.log(`Updated ${docType} > `, updatedDoc);
};

/**
 * A handler we're using to delete a Thunk for dispatching of create/update
 * of given document to firestore
 */
export const deleteDoc: DispatchFS<"delete"> = ({
  docPath,
  docType = "document",
}) => async () => {
  const docRef = doc(getFirestore(), docPath);

  // try and delete document in firestore
  await delDoc(docRef);

  // check updated document and log to console
  const deletedDoc = await getDoc(docRef);

  if (!deletedDoc.exists) {
    console.log(`${docType} successfully deleted`);
  } else {
    console.log(`Error, ${docType} not deleted`);
  }
};
