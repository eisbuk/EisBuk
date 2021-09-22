import { Collection, Customer, OrgSubCollection } from "eisbuk-shared";

import {
  CustomerAttendance,
  NewFirestoreThunk,
  SlotAttendnace,
  SlotInterface,
} from "@/types/temp";

import { ORGANIZATION } from "@/config/envInfo";

/**
 * Function called to mark attendance (with apropriate interval) for customer on given slot:
 * - if customer had booked, updates `attended` interval
 * - if customer had not booked creates a new entry with `booked = null` and `attended` the value of provided interval
 *
 * @param - { slotId, customerId, attendedInterval }
 * @returns a ReduxThunk, reading necessary data from `firestore` entry in redux store
 * and dispatching updates to `firestore` (which then update local store through web sockets, beyond functionality of this Thunk)
 * @TODO This should probably be a @Saga to easily provide throttling until the update has been confirmed (to avoid excess requrests to the backend)
 */
export const markAttendance = ({
  attendedInterval,
  slotId,
  customerId,
}: {
  slotId: SlotInterface["id"];
  customerId: Customer["id"];
  attendedInterval: string;
}): NewFirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  const db = getFirebase().firestore();

  const localState = getState();

  // get month document ref from attendance collection
  const slotToUpdate = db
    .collection(Collection.Organizations)
    .doc(ORGANIZATION)
    .collection(OrgSubCollection.Attendance)
    .doc(slotId);

  // get attendnace entry from local store (to not overwrite the rest of the doc when updating)
  const localAttendnaceEntry = localState.firestore.data.attendance![slotId];

  // update customer attendance from local store with new values
  const updatedCustomerAttendance: CustomerAttendance = {
    booked: localAttendnaceEntry.attendances[customerId]?.booked || null,
    attended: attendedInterval,
  };

  // update month document with new values
  await slotToUpdate.set(
    { attendances: { [customerId]: updatedCustomerAttendance } },
    { merge: true }
  );
};

/**
 * Function called to mark customer absent on given slot:
 * - if customer had booked and didn't arrive, marks attended interval as `null`
 * - if customer had not booked (attendance was there by mistake probably), removes customer from slots attendance
 *
 * @param - { slotId, customerId }
 * @returns a ReduxThunk, reading necessary data from `firestore` entry in redux store
 * and dispatching updates to `firestore` (which then update local store through web sockets, beyond functionality of this Thunk)
 * @TODO This should probably be a @Saga to easily provide throttling until the update has been confirmed (to avoid excess requrests to the backend)
 */
export const markAbsence = ({
  slotId,
  customerId,
}: {
  slotId: SlotInterface["id"];
  customerId: Customer["id"];
}): NewFirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  const db = getFirebase().firestore();

  const localState = getState();

  // get month document ref from attendance collection
  const slotToUpdate = db
    .collection(Collection.Organizations)
    .doc(ORGANIZATION)
    .collection(OrgSubCollection.Attendance)
    .doc(slotId);

  // get attendnace entry from local store (to not overwrite the rest of the doc when updating)
  const localAttendnaceEntry = localState.firestore.data.attendance![slotId];

  // extract customer entry from slot's attendance
  const {
    [customerId]: customerEntry,
    ...attendanceForSlot
  } = localAttendnaceEntry.attendances;

  // if booked not null, customer should stay in db (only mark absence)
  const { booked } = customerEntry || {};
  const updatedCustomerAttendance = booked
    ? {
        [customerId]: {
          booked,
          attended: null,
        },
      }
    : // if not booked and not attended, omit customer from updated document
      {};

  // create proper structure for attendance entry
  const attendanceEntry: SlotAttendnace = {
    ...localAttendnaceEntry,
    attendances: {
      ...attendanceForSlot,
      ...updatedCustomerAttendance,
    },
  };

  // update month document with new values
  await slotToUpdate.set(attendanceEntry);
};
