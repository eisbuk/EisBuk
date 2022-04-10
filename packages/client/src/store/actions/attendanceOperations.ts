import { getFirestore } from "@firebase/firestore";

import {
  Collection,
  Customer,
  OrgSubCollection,
  CustomerAttendance,
  SlotAttendnace,
  SlotInterface,
} from "@eisbuk/shared";

import { getOrganization } from "@/lib/getters";

import { FirestoreThunk } from "@/types/store";

import { showErrSnackbar } from "./appActions";
import { doc, setDoc } from "firebase/firestore";

const getAttendanceCollPath = () =>
  `${Collection.Organizations}/${getOrganization()}/${
    OrgSubCollection.Attendance
  }`;

/**
 * Function called to mark attendance (with apropriate interval) for customer on given slot:
 * - if customer had booked, updates `attended` interval
 * - if customer had not booked creates a new entry with `booked = null` and `attended` the value of provided interval
 *
 * @param - { slotId, customerId, attendedInterval }
 * @returns a ReduxThunk, reading necessary data from `firestore` entry in redux store
 * and dispatching updates to `firestore` (which then update local store through web sockets, beyond functionality of this Thunk)
 */
export const markAttendance =
  ({
    attendedInterval,
    slotId,
    customerId,
  }: {
    slotId: SlotInterface["id"];
    customerId: Customer["id"];
    attendedInterval: string;
  }): FirestoreThunk =>
  async (dispatch, getState) => {
    try {
      const localState = getState();

      const db = getFirestore();
      const slotToUpdate = doc(db, getAttendanceCollPath(), slotId);

      // get attendnace entry from local store (to not overwrite the rest of the doc when updating)
      const localAttendnaceEntry =
        localState.firestore.data.attendance![slotId];

      // update customer attendance from local store with new values
      const updatedCustomerAttendance: CustomerAttendance = {
        bookedInterval:
          localAttendnaceEntry.attendances[customerId]?.bookedInterval || null,
        attendedInterval: attendedInterval,
      };

      // update month document with new values
      await setDoc(
        slotToUpdate,
        { attendances: { [customerId]: updatedCustomerAttendance } },
        { merge: true }
      );
    } catch {
      dispatch(showErrSnackbar);
    }
  };

/**
 * Function called to mark customer absent on given slot:
 * - if customer had booked and didn't arrive, marks attended interval as `null`
 * - if customer had not booked (attendance was there by mistake probably), removes customer from slots attendance
 *
 * @param - { slotId, customerId }
 * @returns a ReduxThunk, reading necessary data from `firestore` entry in redux store
 * and dispatching updates to `firestore` (which then update local store through web sockets, beyond functionality of this Thunk)
 */
export const markAbsence =
  ({
    slotId,
    customerId,
  }: {
    slotId: SlotInterface["id"];
    customerId: Customer["id"];
  }): FirestoreThunk =>
  async (dispatch, getState) => {
    try {
      const localState = getState();

      const db = getFirestore();
      const slotToUpdate = doc(db, getAttendanceCollPath(), slotId);

      // get attendnace entry from local store (to not overwrite the rest of the doc when updating)
      const localAttendnaceEntry =
        localState.firestore.data.attendance![slotId];

      // extract customer entry from slot's attendance
      const { [customerId]: customerEntry, ...attendanceForSlot } =
        localAttendnaceEntry.attendances;

      // if booked not null, customer should stay in db (only mark absence)
      const { bookedInterval } = customerEntry || {};
      const updatedCustomerAttendance = bookedInterval
        ? {
            [customerId]: {
              bookedInterval,
              attendedInterval: null,
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
      await setDoc(slotToUpdate, attendanceEntry);
    } catch {
      dispatch(showErrSnackbar);
    }
  };
