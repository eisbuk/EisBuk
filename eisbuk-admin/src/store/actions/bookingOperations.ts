import i18n from "i18next";

import { Customer, Slot, BookingInfo } from "eisbuk-shared";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";
import { SlotInterface } from "@/types/temp";

import { ORGANIZATION } from "@/config/envInfo";

import {
  enqueueNotification,
  showErrSnackbar,
} from "@/store/actions/appActions";

/**
 * Creates firestore async thunk:
 * - dispatches subscribe to slot (used to slot for current athlete)
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param bookingId athletes secret key (bookings are grouped that way)
 * @param slot slot which to subscribe to, extended with duration the athlete is subscribing for
 * @returns async thunk
 */
export const subscribeToSlot = (
  bookingId: string,
  slot: BookingInfo
): FirestoreThunk => async (dispatch, _getState, { getFirebase }) => {
  const firebase = getFirebase();

  try {
    await firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("bookings")
      .doc(bookingId)
      .collection("data")
      .doc(slot.id)
      .set(slot);

    dispatch(
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: i18n.t("Notification.BookingSuccess"),
        closeButton: true,
        options: {
          variant: NotifVariant.Success,
        },
      })
    );
  } catch {
    showErrSnackbar();
  }
};

/**
 * Creates firestore async thunk:
 * - unsubscribes the current athlete from given slot in firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param bookingId athletes secret key (bookings are grouped that way)
 * @param slot slot which to subscribe to, extended with duration the athlete is subscribing for
 */
export const unsubscribeFromSlot = (
  bookingId: string,
  slotId: Slot<"id">["id"]
): FirestoreThunk => async (dispatch, _getState, { getFirebase }) => {
  const firebase = getFirebase();

  try {
    await firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("bookings")
      .doc(bookingId)
      .collection("data")
      .doc(slotId)
      .delete();

    dispatch(
      enqueueNotification({
        message: i18n.t("Notification.BookingCancelled"),
        closeButton: true,
        options: {
          variant: NotifVariant.Success,
        },
      })
    );
  } catch (err) {
    dispatch(
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: i18n.t("Notification.BookingCancelledError"),
        closeButton: true,
        options: {
          variant: NotifVariant.Error,
        },
      })
    );
  }
};

interface MarkAbsenteePayload {
  slotId: Slot<"id">["id"];
  userId: Customer["id"];
  isAbsent: boolean;
}

/**
 * Creates firestore async thunk:
 * - updates the attendance for given athlete for given slot in firestore (updated back using real time DB)
 * - in case of failure enqueues error snackbar
 * @param slot in which the athlete's attendance is being marked
 * @param user athlete
 * @param isAbsent boolean
 * @returns async thunk
 */
export const markAbsentee = ({
  slotId,
  userId,
  isAbsent,
}: MarkAbsenteePayload): FirestoreThunk => async (
  _dispatch,
  _getState,
  { getFirebase }
) => {
  const firebase = getFirebase();

  try {
    await firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("slots")
      .doc(slotId)
      .set({ absentees: { [userId]: isAbsent } }, { merge: true });
  } catch {
    showErrSnackbar();
  }
};

/**
 * Dispatches booked interval to firestore.
 * Additionally, it cancels booked interval for the same slot if one is already booked.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const bookInterval = (params: {
  slotId: SlotInterface["id"];
  customerId: Customer["id"];
  bookedInterval: string;
}): void => {};

/**
 * Cancels booked inteval of the provided slot for provided customer.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const cancelBooking = (params: {
  slotId: SlotInterface["id"];
  customerId: Customer["id"];
}): void => {};
