import { CustomerAttendance, SlotInterface } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { getOrganization } from "@/lib/getters";

import { enqueueNotification } from "@/features/notifications/actions";

import {
  getAttendanceDocPath,
  doc,
  getDoc,
  getSlotDocPath,
  updateDocInTransaction,
  DELETE_FIELD,
} from "@/utils/firestore";
import { upsertSlot } from "./slotOperations";

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
 * Only the customer's attended interval is written (field path update): the booked interval is maintained by the
 * server from the bookings. A transaction reads the current entry before deciding whether to update it or
 * create a complete entry for an athlete without a booking.
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
  async (dispatch, _, { getFirestore }) => {
    try {
      const db = getFirestore();
      const slotToUpdate = doc(
        db,
        getAttendanceDocPath(getOrganization(), slotId)
      );

      await updateDocInTransaction(slotToUpdate, (data) => {
        const entry = data?.attendances?.[customerId];
        return {
          [`attendances.${customerId}`]: {
            ...entry,
            bookedInterval: entry?.bookedInterval ?? null,
            attendedInterval,
          } as CustomerAttendance,
        };
      });
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
 * Function called to mark attendance (with custom interval) for customer on given slot:
 * - creates the additinal interval in the slot entry
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
export const markAttendanceWithCustomInterval: UpdateAttendance<{
  attendedInterval: string;
}> =
  ({ attendedInterval, slotId, ...attendanceProps }) =>
  async (...thunkProps) => {
    const { getFirestore } = thunkProps[2];

    // Add the new interval to the slot entry
    const [startTime, endTime] = attendedInterval.split("-");

    const organization = getOrganization();

    const slot = await getDoc(
      doc(getFirestore(), getSlotDocPath(organization, slotId))
    ).then((snap) => snap.data() as SlotInterface);

    await upsertSlot({
      ...slot,
      intervals: {
        ...slot.intervals,
        [attendedInterval]: {
          startTime,
          endTime,
        },
      },
    })(...thunkProps);

    // Mark the attendance
    await markAttendance({
      attendedInterval,
      slotId,
      ...attendanceProps,
    })(...thunkProps);
  };

/**
 * Function called to mark customer absent on given slot:
 * - if customer had booked and didn't arrive, marks attended interval as `null`
 * - if customer had not booked (attendance was there by mistake probably), removes customer from slots attendance
 *
 * Only the customer's entry is written. A transaction reads its current booking before choosing to mark
 * absence or remove the entry; a cancelled entry is left absent.
 *
 * @param {Object} payload
 * @param {string} payload.slotId
 * @param {string} payload.customerId
 * @returns a ReduxThunk, reading necessary data from `firestore` entry in redux store
 * and dispatching updates to `firestore` (which then update local store through web sockets, beyond functionality of this Thunk)
 */
export const markAbsence: UpdateAttendance =
  ({ slotId, customerId, name, surname }) =>
  async (dispatch, _, { getFirestore }) => {
    try {
      const db = getFirestore();
      const slotToUpdate = doc(
        db,
        getAttendanceDocPath(getOrganization(), slotId)
      );

      await updateDocInTransaction(slotToUpdate, (data) => {
        const entry = data?.attendances?.[customerId];
        if (!entry) return undefined;
        return entry.bookedInterval
          ? { [`attendances.${customerId}.attendedInterval`]: null }
          : { [`attendances.${customerId}`]: DELETE_FIELD };
      });
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
