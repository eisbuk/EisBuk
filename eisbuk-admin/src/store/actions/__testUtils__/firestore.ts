import { Dispatch } from "redux";

import { LocalStore, FirestoreThunk } from "@/types/store";

import { ORGANIZATION } from "@/config/envInfo";
import { adminDb } from "@/tests/settings";

import { createTestStore, getFirebase } from "@/__testUtils__/firestore";
import {
  Collection,
  OrgSubCollection,
  SlotInterface,
  SlotsByDay,
} from "eisbuk-shared/dist";
import { fb2Luxon, luxon2ISODate } from "@/utils/date";

type ThunkParams = Parameters<FirestoreThunk>;

/**
 * Set up `attendance` data in emulated store and create `getState()` returning redux store
 * filled with `attendance` data as well
 * @param attendance entry for firestore attendance we want to set
 * @returns middleware args (dispatch, setState, { getFirebase } )
 */
export const setupTestAttendance = async (
  attendance: LocalStore["firestore"]["data"]["attendance"]
): Promise<ThunkParams> => {
  // we're not using dispatch so it's here just to comply with type structure
  const dispatch: Dispatch = (value: any) => value;

  // create `getState` state to return store populated with desired values
  const getState = () => createTestStore({ attendance });

  // set desired values to emulated db
  const attendanceColl = adminDb
    .collection("organizations")
    .doc(ORGANIZATION)
    .collection("attendance");
  const updates = Object.keys(attendance!).map((slotId) =>
    attendanceColl.doc(slotId).set(attendance![slotId])
  );

  await Promise.all(updates);

  return [dispatch, getState, { getFirebase }];
};

/**
 * Set up `attendance` data in emulated store and create `getState()` returning redux store
 * filled with `attendance` data as well
 * @param attendance entry for firestore attendance we want to set
 * @returns middleware args (dispatch, setState, { getFirebase } )
 */
export const setupTestSlots = async (
  slots: Record<string, SlotInterface>
): Promise<ThunkParams> => {
  // we're not using dispatch so it's here just to comply with type structure
  const dispatch: Dispatch = (value: any) => value;

  // transform slots to `slotsByDay` store entry struct:
  // get keys (month, day) from `slot.date` and organize accordingly
  const slotsByDay = Object.keys(slots).reduce((acc, slotId) => {
    const slot = slots[slotId];
    const luxonDate = fb2Luxon(slot.date);

    const isoDate = luxon2ISODate(luxonDate);
    const monthStr = isoDate.substr(0, 7);

    const slotsForMonth = acc[monthStr] || {};
    const slotsForDay = slotsForMonth[isoDate] || {};

    return {
      ...acc,
      [monthStr]: {
        ...slotsForMonth,
        [isoDate]: { ...slotsForDay, [isoDate]: slot },
      },
    };
  }, {} as Record<string, SlotsByDay>);

  // create `getState` state to return store populated with desired values
  const getState = () => createTestStore({ slotsByDay });

  // set desired values to emulated db
  const slotsColl = adminDb
    .collection(Collection.Organizations)
    .doc(ORGANIZATION)
    .collection(OrgSubCollection.Slots);

  const updates = Object.keys(slots).map((slotId) =>
    slotsColl.doc(slotId).set(slots[slotId])
  );

  await Promise.all(updates);

  return [dispatch, getState, { getFirebase }];
};
