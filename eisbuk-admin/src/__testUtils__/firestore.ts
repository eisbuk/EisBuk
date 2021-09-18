import { ExtendedFirebaseInstance } from "react-redux-firebase";
import { DateTime } from "luxon";

import { LocalStore } from "@/types/store";

import { defaultState as app } from "@/store/reducers/appReducer";
import { defaultState as copyPaste } from "@/store/reducers/copyPasteReducer";
import { defaultState as authInfoEisbuk } from "@/store/reducers/authReducer";

import { adminDb } from "@/tests/settings";

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
export const createTestStore = (
  data: LocalStore["firestore"]["data"],
  calendarDay?: DateTime
): LocalStore => {
  return {
    ...testStoreDefaultState,
    firestore: { data } as LocalStore["firestore"],
    ...(calendarDay
      ? {
          app: {
            ...testStoreDefaultState.app,
            calendarDay,
          },
        }
      : {}),
  };
};
