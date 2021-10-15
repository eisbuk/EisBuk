import firebase from "firebase/app";

import { FirestoreThunk } from "@/types/store";
import { Collection } from "eisbuk-shared/dist";
import { ORGANIZATION } from "@/config/envInfo";

type DocumentReference = firebase.firestore.DocumentReference;

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
 * A function we're passing as callback to submit/delete function.
 * accepts db (firestore) instance as param and creates ref to document we want
 * to create/update/delete
 */
export interface GetRef {
  (db: DocumentReference): DocumentReference;
}

/**
 * Base params for DispatchFB function (get's extended with `docValues` for "submit" variant)
 */
export interface DispatchFSBaseParams {
  getRef: GetRef;
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
  getRef,
  docValues,
  docType = "document",
}) => async (_dispatch, _getState, { getFirebase }) => {
  const db = getFirebase().firestore();

  const docRef = getRef(
    db.collection(Collection.Organizations).doc(ORGANIZATION)
  );

  // try and set updated document in firestore
  await docRef.set(docValues);

  // check updated document and log to console
  const updatedDoc = (await docRef.get()).data();

  console.log(`Updated ${docType} > `, updatedDoc);
};

/**
 * A handler we're using to delete a Thunk for dispatching of create/update
 * of given document to firestore
 */
export const deleteDoc: DispatchFS<"delete"> = ({
  getRef,
  docType = "document",
}) => async (_dispatch, _getState, { getFirebase }) => {
  const db = getFirebase().firestore();

  const docRef = getRef(
    db.collection(Collection.Organizations).doc(ORGANIZATION)
  );

  // try and delete document in firestore
  await docRef.delete();

  // check updated document and log to console
  const deletedDoc = await docRef.get();

  if (!deletedDoc.exists) {
    console.log(`${docType} successfully deleted`);
  } else {
    console.log(`Error, ${docType} not deleted`);
  }
};
