import { Dispatch } from "redux";
import { DateTime } from "luxon";

import {
  Collection,
  OrgSubCollection,
  SlotInterface,
  SlotsByDay,
  CustomerBookings,
  Customer,
  BookingSubCollection,
} from "eisbuk-shared";

import { LocalStore, FirestoreThunk } from "@/types/store";

import { ORGANIZATION } from "@/config/envInfo";
import { adminDb } from "@/tests/settings";

import { createTestStore, getFirebase } from "@/__testUtils__/firestore";

import { testDateLuxon } from "@/__testData__/date";

type ThunkParams = Parameters<FirestoreThunk>;

/**
 * Saved organization ref in db, to reduce excess typing
 */
const orgDb = adminDb.collection(Collection.Organizations).doc(ORGANIZATION);

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
  const attendanceColl = orgDb.collection(OrgSubCollection.Attendance);
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
  const slotsByDay = aggregateSlots(slots);

  // create `getState` state to return store populated with desired values
  const getState = () => createTestStore({ data: { slotsByDay }, date });

  // set desired values to emulated db
  const slotsColl = orgDb.collection(OrgSubCollection.Slots);

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

/**
 * Set up `bookings` data in emulated store and create `getState()` returning redux store
 * filled with `attendance` data as well
 * @param attendance entry for firestore attendance we want to set
 * @returns middleware args (dispatch, setState, { getFirebase } )
 */
export const setupTestBookings = async ({
  bookedSlots,
  secretKey,
  dispatch = (value: any) => value,
}: {
  bookedSlots: Required<CustomerBookings>["bookedSlots"];
  secretKey: Customer["secretKey"];
  dispatch?: Dispatch;
}): Promise<ThunkParams> => {
  // We're creating an empty store to comply with the type interface
  const getState = () => createTestStore({});

  // saved ref for customer's `bookings` doc
  const bookingsRef = orgDb
    .collection(OrgSubCollection.Bookings)
    .doc(secretKey);

  // set booked slots to emulated store
  const bookingsToUpdate = Object.keys(bookedSlots).map((slotId) =>
    bookingsRef
      .collection(BookingSubCollection.BookedSlots)
      .doc(slotId)
      .set(bookedSlots[slotId])
  );
  await Promise.all(bookingsToUpdate);

  return [dispatch, getState, { getFirebase }];
};

/**
 * A helper function used to simulate slot aggregation (creates `slotsByDay` entry).
 * Used to populate mocked local store
 * @param slots keyed by slot id
 * @returns slotsByDay
 */
const aggregateSlots = (slots: Record<string, SlotInterface>) =>
  Object.keys(slots).reduce((acc, slotId) => {
    const slot = slots[slotId];

    const { date } = slot;
    const monthStr = date.substr(0, 7);

    const slotsForMonth = acc[monthStr] || {};
    const slotsForDay = slotsForMonth[date] || {};

    return {
      ...acc,
      [monthStr]: {
        ...slotsForMonth,
        [date]: { ...slotsForDay, [slotId]: slot },
      },
    };
  }, {} as Record<string, SlotsByDay>);
