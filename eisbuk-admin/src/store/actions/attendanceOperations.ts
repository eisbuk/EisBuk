import { Customer, Slot } from "eisbuk-shared";

import { NewFirestoreThunk } from "@/types/temp";

import { ORGANIZATION } from "@/config/envInfo";

import { luxon2ISODate } from "@/utils/date";

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
  slotId: Slot<"id">["id"];
  customerId: Customer["id"];
  attendedInterval: string;
}): NewFirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  const db = getFirebase().firestore();

  const localState = getState();

  // get date from store (to easier find the attendance entry)
  const date = luxon2ISODate(localState.app.calendarDay);
  const monthString = date.substr(0, 7);

  // get month document ref from attendance collection
  const monthToUpdate = db
    .collection("organizations")
    .doc(ORGANIZATION)
    .collection("attendance")
    .doc(monthString);

  // get month entry from store (to not overwrite the data that shouldn't be overwritten)
  const localMonthAttendance = localState.firestore.data.attendance![
    monthString
  ];
  // update customer attendance from local store with new values
  const updatedCustomerAttendance = {
    booked: null,
    ...localMonthAttendance[date][slotId][customerId],
    attended: attendedInterval,
  };

  // create proper structure for attendance entry
  const attendanceEntry = {
    ...localMonthAttendance,
    [date]: {
      ...localMonthAttendance[date],
      [slotId]: {
        ...localMonthAttendance[date][slotId],
        [customerId]: updatedCustomerAttendance,
      },
    },
  };

  // update month document with new values
  await monthToUpdate.set(attendanceEntry);
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
  slotId: Slot<"id">["id"];
  customerId: Customer["id"];
}): NewFirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  const db = getFirebase().firestore();

  const localState = getState();

  // get date from store (to easier find the attendance entry)
  const date = luxon2ISODate(localState.app.calendarDay);
  const monthString = date.substr(0, 7);

  // get month document ref from attendance collection
  const monthToUpdate = db
    .collection("organizations")
    .doc(ORGANIZATION)
    .collection("attendance")
    .doc(monthString);

  // get month entry from store (to not overwrite the rest of the doc when updating)
  const localMonthAttendance = localState.firestore.data.attendance![
    monthString
  ];

  // extract customer entry from slot's attendance
  const {
    [customerId]: customerEntry,
    ...attendanceForSlot
  } = localMonthAttendance[date][slotId];

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
  const attendanceEntry = {
    ...localMonthAttendance,
    [date]: {
      ...localMonthAttendance[date],
      [slotId]: {
        ...attendanceForSlot,
        ...updatedCustomerAttendance,
      },
    },
  };

  // update month document with new values
  await monthToUpdate.set(attendanceEntry);
};
