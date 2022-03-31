import { deleteDoc, doc, getFirestore, setDoc } from "@firebase/firestore";

import {
  BookingSubCollection,
  Collection,
  Customer,
  OrgSubCollection,
  SlotInterface,
} from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getOrganization } from "@/lib/getters";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { enqueueNotification, showErrSnackbar } from "./appActions";

const getBookingsPath = () =>
  `${Collection.Organizations}/${getOrganization()}/${
    OrgSubCollection.Bookings
  }`;

/**
 * Dispatches booked interval to firestore.
 * Additionally, it cancels booked interval for the same slot if one is already booked.
 */
export const bookInterval =
  ({
    slotId,
    secretKey,
    bookedInterval,
    date,
  }: {
    slotId: SlotInterface["id"];
    secretKey: Customer["secretKey"];
    bookedInterval: string;
    date: SlotInterface["date"];
  }): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      const docRef = doc(
        db,
        getBookingsPath(),
        secretKey,
        BookingSubCollection.BookedSlots,
        slotId
      );

      // update booked interval to firestore
      await setDoc(docRef, { interval: bookedInterval, date });

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
export const cancelBooking =
  ({
    slotId,
    secretKey,
  }: {
    slotId: SlotInterface["id"];
    secretKey: Customer["secretKey"];
  }): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      const docRef = doc(
        db,
        getBookingsPath(),
        secretKey,
        BookingSubCollection.BookedSlots,
        slotId
      );

      // remove the booking from firestore
      await deleteDoc(docRef);

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
