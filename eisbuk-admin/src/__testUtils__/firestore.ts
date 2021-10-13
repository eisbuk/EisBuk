import { DateTime } from "luxon";
import { Firestore } from "@google-cloud/firestore";
import { cloneDeep } from "lodash";

import { adminDb } from "@/tests/settings";

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
export const getFirebase = (): { firestore: () => Firestore } => ({
  firestore: () => adminDb,
});

const testStoreDefaultState: LocalStore = {
  firestore: {
    data: {},
    listeners: {},
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
