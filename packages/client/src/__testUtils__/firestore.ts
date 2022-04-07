import { DateTime } from "luxon";
import { cloneDeep } from "lodash";

import { Collection, OrgSubCollection } from "@eisbuk/shared";

import { adminDb } from "@/__testSetup__/firestoreSetup";

import { __organization__ } from "@/lib/constants";

import { LocalStore } from "@/types/store";

import { defaultState as app } from "@/store/reducers/appReducer";
import { defaultState as copyPaste } from "@/store/reducers/copyPasteReducer";
import { defaultState as auth } from "@/store/reducers/authReducer";

const testStoreDefaultState: LocalStore = {
  firestore: {
    data: {},
    listeners: {},
  },
  app,
  copyPaste,
  auth,
};

/**
 * Function we're using to create a store state with the same structure as in production
 * only with (simulated) `firestore` data provided by `data` param
 */
export const createTestStore = ({
  data = {},
  listeners = {},
  date,
  copyPaste = { day: null, week: null },
}: {
  data?: LocalStore["firestore"]["data"];
  listeners?: LocalStore["firestore"]["listeners"];
  date?: DateTime;
  copyPaste?: LocalStore["copyPaste"];
}): LocalStore => {
  return cloneDeep({
    ...testStoreDefaultState,
    firestore: { data, listeners },
    ...(date
      ? {
          app: {
            ...testStoreDefaultState.app,
            calendarDay: date,
          },
        }
      : {}),
    copyPaste,
  });
};

/**
 * Test util: deletes provided collections from "default" organization in emulated firestore db
 * @param collections to delete
 * @returns
 */
export const deleteAll = async (): Promise<void> => {
  const org = adminDb
    .collection(Collection.Organizations)
    .doc(__organization__);

  const operations: Promise<any>[] = [];

  // delete org and subcollections
  operations.push(deleteAllCollections(org, Object.values(OrgSubCollection)));

  // delete secrets
  const orgSecrets = adminDb
    .collection(Collection.Secrets)
    .doc(__organization__);
  operations.push(orgSecrets.delete());

  // remove `existingSecrets` from organization
  operations.push(org.set({ existingSecrets: [] }, { merge: true }));

  await Promise.all(operations);
};

/**
 * Test util: deletes provided collections from provided db
 * @param db to delete from
 * @param collections to delete
 * @returns
 */
export const deleteAllCollections = async (
  db:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Firestore,
  collections: string[]
): Promise<any> =>
  Promise.all(collections.map((coll) => deleteCollection(db.collection(coll))));

/**
 * Deletes all documents in a collection
 * @param collRef
 * @returns
 */
export const deleteCollection = async (
  collRef: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>
): Promise<FirebaseFirestore.WriteResult[]> => {
  const docs = (await collRef.get()).docs;
  return Promise.all(docs.map((doc) => doc.ref.delete()));
};
