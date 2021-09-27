import { Dispatch } from "redux";
import { DateTime } from "luxon";

import { LocalStore, FirestoreThunk } from "@/types/store";

import { ORGANIZATION } from "@/config/envInfo";
import { adminDb } from "@/tests/settings";

import { fb2Luxon, luxon2ISODate } from "@/utils/date";

import { createTestStore, getFirebase } from "@/__testUtils__/firestore";
import {
  Collection,
  OrgSubCollection,
  SlotInterface,
  SlotsByDay,
} from "eisbuk-shared/dist";

import { testDateLuxon } from "@/__testData__/date";

type ThunkParams = Parameters<FirestoreThunk>;

/**
 * Set up `attendance` data in emulated store and create `getState()` returning redux store
 * filled with `attendance` data as well
 * @param attendance entry for firestore attendance we want to set
 * @returns middleware args (dispatch, setState, { getFirebase } )
 */
export const setupTestAttendance = async ({
  attendance,
  dispatch = (value: any) => value,
}: {
  attendance: LocalStore["firestore"]["data"]["attendance"];
  dispatch?: Dispatch;
}): Promise<ThunkParams> => {
  // create `getState` state to return store populated with desired values
  const getState = () => createTestStore({ data: { attendance } });

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
export const setupTestSlots = async ({
  slots,
  dispatch = (value: any) => value,
  date = testDateLuxon,
}: {
  slots: Record<string, SlotInterface>;
  dispatch?: Dispatch;
  date?: DateTime;
}): Promise<ThunkParams> => {
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
        [isoDate]: { ...slotsForDay, [slotId]: slot },
      },
    };
  }, {} as Record<string, SlotsByDay>);

  // create `getState` state to return store populated with desired values
  const getState = () => createTestStore({ data: { slotsByDay }, date });

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

/**
 * Set up `attendance` data in emulated store and create `getState()` returning redux store
 * filled with `attendance` data as well
 * @param attendance entry for firestore attendance we want to set
 * @returns middleware args (dispatch, setState, { getFirebase } )
 */
export const setupCopyPaste = async ({
  day = null,
  week = null,
  dispatch = (value: any) => value,
}: {
  day?: LocalStore["copyPaste"]["day"];
  week?: LocalStore["copyPaste"]["week"];
  dispatch?: Dispatch;
}): Promise<ThunkParams> => {
  const copyPaste = { day, week };
  // create `getState` state to return store populated with desired values
  const getState = () => createTestStore({ copyPaste });

  return [dispatch, getState, { getFirebase }];
};
