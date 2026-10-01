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
  setDocInTransaction,
} from "@/utils/firestore";
import { getOrganization } from "@/lib/getters";

interface UpdateBooking<
  P extends Record<string, any> = Record<string, unknown>,
> {
  (
    payload: {
      slotId: SlotInterface["id"];
      secretKey: Customer["secretKey"];
      date: string;
      interval: string;
    } & P,
  ): FirestoreThunk;
}

/**
 * Thrown (inside the booking transaction) when the lesson is already booked with an interval
 * other than the one the athlete explicitly chose to replace.
 */
class BookingConflictError extends Error {
  // eslint-disable-next-line require-jsdoc
  constructor(public bookedInterval: string) {
    super(`Lesson already booked with interval ${bookedInterval}`);
  }
}

/**
 * Dispatches booked interval to firestore.
 *
 * There is one booking per athlete per lesson (slot), so booking an interval writes over the interval
 * already booked for the same lesson, if any. That only happens if `replacedInterval` is passed and matches
 * the stored booking: it's the interval the athlete explicitly confirmed to replace. Otherwise an existing booking
 * is never changed (an error notification is shown instead).
 *
 * The check is done in a transaction against the stored booking (not the local store), so that a stale view
 * (page still loading, another device, a second click while the first write is in flight) can't replace a booking.
 */
export const bookInterval: UpdateBooking<{ replacedInterval?: string }> =
  ({ slotId, secretKey, interval, date, replacedInterval }): FirestoreThunk =>
  async (dispatch, _, { getFirestore }) => {
    try {
      const db = getFirestore();

      await setDocInTransaction(
        doc(db, getBookedSlotDocPath(getOrganization(), secretKey, slotId)),
        (booking) => {
          // Interval already booked (e.g. a repeated click): nothing to do
          if (booking?.interval === interval) return undefined;

          if (booking && booking.interval !== replacedInterval) {
            throw new BookingConflictError(booking.interval);
          }

          // Keep the booking notes (if any) when replacing the interval
          return booking?.bookingNotes
            ? { interval, date, bookingNotes: booking.bookingNotes }
            : { interval, date };
        },
      );

      // show success message
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.BookingSuccess, {
            date: DateTime.fromISO(date),
            interval,
          }),
          variant: NotifVariant.Success,
        }),
      );
    } catch (err) {
      if (err instanceof BookingConflictError) {
        dispatch(
          enqueueNotification({
            message: i18n.t(NotificationMessage.BookingAlreadyExists, {
              date: DateTime.fromISO(date),
              interval: err.bookedInterval,
            }),
            variant: NotifVariant.Error,
          }),
        );
        return;
      }

      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.BookingError, {
            date: DateTime.fromISO(date),
            interval,
          }),
          variant: NotifVariant.Error,
          error: err as Error,
        }),
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
        doc(db, getBookedSlotDocPath(getOrganization(), secretKey, slotId)),
      );

      // show success message
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.BookingCanceled, {
            date: DateTime.fromISO(date),
            interval,
          }),
          variant: NotifVariant.Success,
        }),
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
        }),
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
        getBookedSlotDocPath(organization, secretKey, slotId),
      );

      await setDoc(bookingDocRef, { ...booking, bookingNotes });

      dispatch(
        enqueueNotification({
          variant: NotifVariant.Success,
          message: i18n.t(NotificationMessage.BookingNotesUpdated),
        }),
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          variant: NotifVariant.Error,
          message: i18n.t(NotificationMessage.BookingNotesError),
          error: err as Error,
        }),
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
        }),
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          variant: NotifVariant.Error,
          message: i18n.t(NotificationMessage.CustomerProfileError),
          error: err as Error,
        }),
      );
    }
  };

export const customerSelfRegister: {
  (
    paylod: CustomerBase & { registrationCode: string },
  ): (
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
        payload,
      )();
      const { id, secretKey } = res.data;

      dispatch(
        enqueueNotification({
          variant: NotifVariant.Success,
          message: i18n.t(NotificationMessage.SelfRegSuccess),
        }),
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
        }),
      );
      // Only report the registration code as wrong when the backend explicitly
      // rejected it ('unauthenticated'). For any other failure (network,
      // backend error, ...) returning codeOk: false would show a misleading
      // "invalid registration code" field error and send the athlete chasing
      // a code that is in fact correct.
      const isInvalidCode =
        (err as { code?: string })?.code === "functions/unauthenticated";
      return { id: "", secretKey: "", codeOk: !isInvalidCode };
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
        }),
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          variant: NotifVariant.Error,
          message: i18n.t(NotificationMessage.Error),
          error: err as Error,
        }),
      );
    }
  };
