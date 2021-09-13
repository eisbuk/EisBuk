import { Dispatch } from "redux";

import { TempStore, NewFirestoreThunk } from "@/types/temp";

import { ORGANIZATION } from "@/config/envInfo";

import { createTestStore, getFirebase } from "@/__testUtils__/firestore";

type ThunkParams = Parameters<NewFirestoreThunk>;

/**
 * Set up `attendance` data in emulated store and create `getState()` returning redux store
 * filled with `attendance` data as well
 * @param attendance entry for firestore attendance we want to set
 * @returns middleware args (dispatch, setState, { getFirebase } )
 */
export const setupTestAttendance = async (
  attendance: TempStore["firestore"]["data"]["attendance"]
): Promise<ThunkParams> => {
  // we're not using dispatch so it's here just to comply with type structure
  const dispatch: Dispatch = (value: any) => value;

  // create `getState` state to return store populated with desired values
  const getState = () => createTestStore({ attendance });

  // set desired values to emulated db
  const attendanceColl = getFirebase()
    .firestore()
    .collection("organizations")
    .doc(ORGANIZATION)
    .collection("attendance");
  const updates = Object.keys(attendance!).map((slotId) =>
    attendanceColl.doc(slotId).set(attendance![slotId])
  );

  await Promise.all(updates);

  return [dispatch, getState, { getFirebase }];
};
