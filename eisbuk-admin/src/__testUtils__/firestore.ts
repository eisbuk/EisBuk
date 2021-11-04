import "firebase/auth";
import { ExtendedFirebaseInstance } from "react-redux-firebase";
import { DateTime } from "luxon";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { adminDb } from "@/__testSettings__";
import { __organization__ } from "@/lib/constants";

import { LocalStore } from "@/types/store";

import { defaultState as app } from "@/store/reducers/appReducer";
import { defaultState as copyPaste } from "@/store/reducers/copyPasteReducer";
import { defaultState as authInfoEisbuk } from "@/store/reducers/authReducer";

/**
 * Function we're using to simulate `getFirebase` function passed to Redux middleware.
 * Essentially we're returning firestore as `adminDb` already configured in settings to emulated db in the
 * same way `getFirebase` would return firestore inside of Redux middleware.
 * @returns firestore instance
 */
export const getFirebase = (): ExtendedFirebaseInstance =>
  (({
    firestore: () => adminDb,
  } as unknown) as ExtendedFirebaseInstance);

/**
 * Empty store state we're using to provide type compliant baseline for test store state
 */
const fbStatus = { requested: {}, requesting: {}, timestamps: {} };
const fbData = {
  data: {},
  ordered: {},
  listeners: { byId: {}, allIds: [] as [] },
  queries: {},
};

const testStoreDefaultState: LocalStore = {
  firebase: {
    ...fbData,
    ...fbStatus,
    auth: {} as any,
    profile: {} as any,
    isInitializing: false,
    authError: null,
    errors: [],
  },
  firestore: {
    ...fbData,
    status: fbStatus,
    errors: { byQuery: {}, allIds: [] as [] },
  },
  app,
  copyPaste,
  authInfoEisbuk,
};

/**
 * Function we're using to create a store state with the same structure as in production
 * only with (simulated) `firestore` data provided by `data` param
 */
export const createTestStore = ({
  data = {},
  date,
  copyPaste = { day: null, week: null },
}: {
  data?: LocalStore["firestore"]["data"];
  date?: DateTime;
  copyPaste?: LocalStore["copyPaste"];
}): LocalStore => {
  return {
    ...testStoreDefaultState,
    firestore: { data } as LocalStore["firestore"],
    ...(date
      ? {
          app: {
            ...testStoreDefaultState.app,
            calendarDay: date,
          },
        }
      : {}),
    copyPaste,
  };
};

/**
 * Test util: creates default organization ("default") in emulated firestore db
 * and adds admin ("test@example.com")
 * @returns
 */
export const createDefaultOrg = (): Promise<FirebaseFirestore.WriteResult> => {
  const orgDefinition = {
    admins: ["test@example.com"],
  };

  return adminDb.collection("organizations").doc("default").set(orgDefinition);
};

/**
 * Test util: deletes provided collections from "default" organization in emulated firestore db
 * @param collections to delete
 * @returns
 */
export const deleteAll = async (): Promise<FirebaseFirestore.WriteResult[]> => {
  const org = adminDb
    .collection(Collection.Organizations)
    .doc(__organization__);

  return deleteAllCollections(org, Object.values(OrgSubCollection));
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
): Promise<FirebaseFirestore.WriteResult[]> => {
  const toDelete: Promise<FirebaseFirestore.WriteResult>[] = [];

  for (const coll of collections) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await db.collection(coll).get();
    existing.forEach((el) => {
      toDelete.push(el.ref.delete());
    });
  }

  return Promise.all(toDelete);
};
