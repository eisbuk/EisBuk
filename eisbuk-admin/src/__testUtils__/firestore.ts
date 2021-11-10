import { DateTime } from "luxon";
import { cloneDeep } from "lodash";

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
