import { DateTime } from "luxon";

import {
  Customer,
  SlotInterface,
  CustomerBase,
  normalizeEmail,
} from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { createFunctionCaller } from "@/utils/firebase";

import { enqueueNotification } from "@/features/notifications/actions";

import {
  getBookedSlotDocPath,
  deleteDoc,
  doc,
  setDoc,
} from "@/utils/firestore";
import { getOrganization } from "@/lib/getters";

interface UpdateBooking<
  P extends Record<string, any> = Record<string, unknown>
> {
  (
    payload: {
      slotId: SlotInterface["id"];
      secretKey: Customer["secretKey"];
      date: string;
      interval: string;
    } & P
  ): FirestoreThunk;
}

/**
 * Dispatches booked interval to firestore.
 * Additionally, it cancels booked interval for the same slot if one is already booked.
 */
export const bookInterval: UpdateBooking =
  ({ slotId, secretKey, interval, date }): FirestoreThunk =>
  async (dispatch, _, { getFirestore }) => {
    try {
      const db = getFirestore();

      // update booked interval to firestore
      await setDoc(
        doc(db, getBookedSlotDocPath(getOrganization(), secretKey, slotId)),
        { interval, date }
      );

      // show success message
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.BookingSuccess, {
            date: DateTime.fromISO(date),
            interval,
          }),
          variant: NotifVariant.Success,
        })
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.BookingError, {
            date: DateTime.fromISO(date),
            interval,
          }),
          variant: NotifVariant.Error,
          error: err as Error,
        })
      );
    }
  };

/**
 * Cancels booked inteval of the provided slot for provided customer.
 */
export const cancelBooking: UpdateBooking =
  ({ slotId, secretKey, date, interval }) =>
  async (dispatch, _, { getFirestore }) => {
    try {
      const db = getFirestore();

      // remove the booking from firestore
      await deleteDoc(
        doc(db, getBookedSlotDocPath(getOrganization(), secretKey, slotId))
      );

      // show success message
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.BookingCanceled, {
            date: DateTime.fromISO(date),
            interval,
          }),
          variant: NotifVariant.Success,
        })
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.BookingCanceledError, {
            date: DateTime.fromISO(date),
            interval,
          }),
          variant: NotifVariant.Error,
          error: err as Error,
        })
      );
    }
  };

export const updateBookingNotes: UpdateBooking<{ bookingNotes: string }> =
  ({ secretKey, slotId, bookingNotes }) =>
  async (dispatch, getState, { getFirestore }) => {
    const organization = getOrganization();

    try {
      const db = getFirestore();

      const booking = getState().firestore.data.bookedSlots![slotId];

      const bookingDocRef = doc(
        db,
        getBookedSlotDocPath(organization, secretKey, slotId)
      );

      await setDoc(bookingDocRef, { ...booking, bookingNotes });

      dispatch(
        enqueueNotification({
          variant: NotifVariant.Success,
          message: i18n.t(NotificationMessage.BookingNotesUpdated),
        })
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          variant: NotifVariant.Error,
          message: i18n.t(NotificationMessage.BookingNotesError),
          error: err as Error,
        })
      );
    }
  };

/**
 * Updates customer data in bookings collection
 * @param payload.customer {Customer} - cutomer type
 * @returns FirestoreThunk
 */
export const customerSelfUpdate: {
  (paylod: CustomerBase & { secretKey: string }): FirestoreThunk;
} =
  (customer) =>
  async (dispatch, _, { getFunctions }) => {
    try {
      const organization = getOrganization();

      const handler = CloudFunction.CustomerSelfUpdate;
      const payload = {
        organization,
        customer,
      };

      await createFunctionCaller(getFunctions(), handler, payload)();

      dispatch(
        enqueueNotification({
          variant: NotifVariant.Success,
          message: i18n.t(NotificationMessage.CustomerProfileUpdated),
        })
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          variant: NotifVariant.Error,
          message: i18n.t(NotificationMessage.CustomerProfileError),
          error: err as Error,
        })
      );
    }
  };

export const customerSelfRegister: {
  (paylod: CustomerBase & { registrationCode: string }): (
    ...params: Parameters<FirestoreThunk>
  ) => Promise<{ id: string; secretKey: string; codeOk: boolean }>;
} =
  ({ registrationCode, ...customer }) =>
  async (dispatch, _, { getFunctions }) => {
    try {
      const organization = getOrganization();

      if (customer.email) {
        customer.email = normalizeEmail(customer.email);
      }

      const handler = CloudFunction.CustomerSelfRegister;
      const payload = {
        organization,
        customer,
        registrationCode,
      };

      const res = await createFunctionCaller(
        getFunctions(),
        handler,
        payload
      )();
      const { id, secretKey } = res.data;

      dispatch(
        enqueueNotification({
          variant: NotifVariant.Success,
          message: i18n.t(NotificationMessage.SelfRegSuccess),
        })
      );
      return {
        id,
        secretKey,
        codeOk: true,
      };
    } catch (err) {
      dispatch(
        enqueueNotification({
          variant: NotifVariant.Error,
          message: i18n.t(NotificationMessage.SelfRegError),
          error: err as Error,
        })
      );
      return { id: "", secretKey: "", codeOk: false };
    }
  };

/**
 * Updates `privacyPolicyAccepted` field in customer document (as well as in bookings copy)
 * @param payload.customer {Customer} - cutomer type
 * @returns FirestoreThunk
 */
export const acceptPrivacyPolicy: {
  (paylod: Customer): FirestoreThunk;
} =
  (customer) =>
  async (dispatch, _, { getFunctions }) => {
    try {
      const organization = getOrganization();

      const { id, secretKey } = customer;
      const handler = CloudFunction.AcceptPrivacyPolicy;
      const timestamp = DateTime.now().toISO();
      const payload = {
        organization,
        id,
        secretKey,
        timestamp,
      };

      await createFunctionCaller(getFunctions(), handler, payload)();

      dispatch(
        enqueueNotification({
          variant: NotifVariant.Success,
          message: i18n.t(NotificationMessage.SelectionSaved),
        })
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          variant: NotifVariant.Error,
          message: i18n.t(NotificationMessage.Error),
          error: err as Error,
        })
      );
    }
  };
