import { deleteDoc, doc, getFirestore, setDoc } from "@firebase/firestore";

import { Customer, SlotInterface } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { enqueueNotification, showErrSnackbar } from "./appActions";

import { getBookedSlotDocPath } from "@/utils/firestore";
import { getOrganization } from "@/lib/getters";

interface UpdateBooking<
  P extends Record<string, any> = Record<string, unknown>
> {
  (
    payload: {
      slotId: SlotInterface["id"];
      secretKey: Customer["secretKey"];
    } & P
  ): FirestoreThunk;
}

/**
 * Dispatches booked interval to firestore.
 * Additionally, it cancels booked interval for the same slot if one is already booked.
 */
export const bookInterval: UpdateBooking<{
  bookedInterval: string;
  date: SlotInterface["date"];
}> =
  ({ slotId, secretKey, bookedInterval, date }): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();

      // update booked interval to firestore
      await setDoc(
        doc(db, getBookedSlotDocPath(getOrganization(), secretKey, slotId)),
        { interval: bookedInterval, date }
      );

      // show success message
      dispatch(
        enqueueNotification({
          key: new Date().getTime() + Math.random(),
          message: i18n.t(NotificationMessage.BookingSuccess),
          closeButton: true,
          options: {
            variant: NotifVariant.Success,
          },
        })
      );
    } catch {
      dispatch(showErrSnackbar);
    }
  };

/**
 * Cancels booked inteval of the provided slot for provided customer.
 */
export const cancelBooking: UpdateBooking =
  ({ slotId, secretKey }) =>
  async (dispatch) => {
    try {
      const db = getFirestore();

      // remove the booking from firestore
      await deleteDoc(
        doc(db, getBookedSlotDocPath(getOrganization(), secretKey, slotId))
      );

      // show success message
      dispatch(
        enqueueNotification({
          key: new Date().getTime() + Math.random(),
          message: i18n.t(NotificationMessage.BookingCanceled),
          closeButton: true,
          options: {
            variant: NotifVariant.Success,
          },
        })
      );
    } catch {
      dispatch(showErrSnackbar);
    }
  };
