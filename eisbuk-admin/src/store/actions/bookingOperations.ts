import i18n from "i18next";

import {
  BookingSubCollection,
  Collection,
  Customer,
  OrgSubCollection,
  SlotInterface,
} from "eisbuk-shared";

import { getOrganization } from "@/config/envInfo";

import { NotifVariant } from "@/enums/store";
import { NotificationMessage } from "@/enums/translations";

import { FirestoreThunk } from "@/types/store";

import { enqueueNotification, showErrSnackbar } from "./appActions";

/**
 * Dispatches booked interval to firestore.
 * Additionally, it cancels booked interval for the same slot if one is already booked.
 */
export const bookInterval = ({
  slotId,
  secretKey,
  bookedInterval,
  date,
}: {
  slotId: SlotInterface["id"];
  secretKey: Customer["secretKey"];
  bookedInterval: string;
  date: SlotInterface["date"];
}): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  try {
    const db = getFirebase().firestore();

    // update booked interval to firestore
    await db
      .collection(Collection.Organizations)
      .doc(getOrganization())
      .collection(OrgSubCollection.Bookings)
      .doc(secretKey)
      .collection(BookingSubCollection.BookedSlots)
      .doc(slotId)
      .set({ interval: bookedInterval, date });

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
export const cancelBooking = ({
  slotId,
  secretKey,
}: {
  slotId: SlotInterface["id"];
  secretKey: Customer["secretKey"];
}): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  try {
    const db = getFirebase().firestore();

    // remove the booking from firestore
    await db
      .collection(Collection.Organizations)
      .doc(getOrganization())
      .collection(OrgSubCollection.Bookings)
      .doc(secretKey)
      .collection(BookingSubCollection.BookedSlots)
      .doc(slotId)
      .delete();

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
