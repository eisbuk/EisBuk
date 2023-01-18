import { getFirestore, doc, setDoc } from "@firebase/firestore";

import {
  CustomerAttendance,
  SlotAttendnace,
  SlotInterface,
} from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { getOrganization } from "@/lib/getters";

import { enqueueNotification } from "@/features/notifications/actions";

import { getAttendanceDocPath } from "@/utils/firestore";

interface UpdateAttendance<
  P extends Record<string, any> = Record<string, unknown>
> {
  (
    payload: {
      slotId: SlotInterface["id"];
      customerId: string;
      name: string;
      surname: string;
    } & P
  ): FirestoreThunk;
}

/**
 * Function called to mark attendance (with apropriate interval) for customer on given slot:
 * - if customer had booked, updates `attended` interval
 * - if customer had not booked creates a new entry with `booked = null` and `attended` the value of provided interval
 *
 * @param {Object} payload
 * @param {string} payload.slotId
 * @param {string} payload.customerId
 * @param {string} payload.attendedInterval
 * @returns {FirestoreThunk} a ReduxThunk, reading necessary data from `firestore` entry in redux store
 * and dispatching updates to firestore (which then update local store through web sockets, beyond functionality of this Thunk)
 */
export const markAttendance: UpdateAttendance<{ attendedInterval: string }> =
  ({ attendedInterval, slotId, customerId, name, surname }) =>
  async (dispatch, getState) => {
    try {
      const localState = getState();

      const db = getFirestore();
      const slotToUpdate = doc(
        db,
        getAttendanceDocPath(getOrganization(), slotId)
      );

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
    } catch (err) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.MarkAttendanceError, {
            name,
            surname,
          }),
          variant: NotifVariant.Error,
          error: err as Error,
        })
      );
    }
  };

/**
 * Function called to mark customer absent on given slot:
 * - if customer had booked and didn't arrive, marks attended interval as `null`
 * - if customer had not booked (attendance was there by mistake probably), removes customer from slots attendance
 *
 * @param {Object} payload
 * @param {string} payload.slotId
 * @param {string} payload.customerId
 * @returns a ReduxThunk, reading necessary data from `firestore` entry in redux store
 * and dispatching updates to `firestore` (which then update local store through web sockets, beyond functionality of this Thunk)
 */
export const markAbsence: UpdateAttendance =
  ({ slotId, customerId, name, surname }) =>
  async (dispatch, getState) => {
    try {
      const localState = getState();

      const db = getFirestore();
      const slotToUpdate = doc(
        db,
        getAttendanceDocPath(getOrganization(), slotId)
      );

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
    } catch (err) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.MarkAbsenceError, {
            name,
            surname,
          }),
          variant: NotifVariant.Error,
          error: err as Error,
        })
      );
    }
  };
