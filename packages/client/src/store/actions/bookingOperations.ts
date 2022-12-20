import { deleteDoc, doc, getFirestore, setDoc } from "@firebase/firestore";

import {
  BookingSubCollection,
  Customer,
  SlotInterface,
  OrganizationData,
  ClientEmailPayload,
  EmailType,
  CustomerBase,
} from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";
import { NotifVariant } from "@/enums/store";
import { CloudFunction } from "@/enums/functions";

import { FirestoreThunk } from "@/types/store";

import { createCloudFunctionCaller } from "@/utils/firebase";

import { enqueueNotification } from "@/features/notifications/actions";

import { getBookedSlotDocPath, getBookingsPath } from "@/utils/firestore";
import { getOrganization } from "@/lib/getters";
import { __organization__ } from "@/lib/constants";

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
          message: i18n.t(NotificationMessage.BookingSuccess),
          variant: NotifVariant.Success,
        })
      );
    } catch {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.Error),
          variant: NotifVariant.Error,
        })
      );
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
          message: i18n.t(NotificationMessage.BookingCanceled),
          variant: NotifVariant.Success,
        })
      );
    } catch {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.Error),
          variant: NotifVariant.Error,
        })
      );
    }
  };

export const updateBookingNotes: UpdateBooking<{ bookingNotes: string }> =
  ({ secretKey, slotId, bookingNotes }) =>
  async (dispatch, getState) => {
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
    } catch (error) {
      dispatch(
        enqueueNotification({
          variant: NotifVariant.Error,
          message: i18n.t(NotificationMessage.BookingNotesError),
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
} = (customer) => async (dispatch) => {
  try {
    const organization = getOrganization();

    const handler = CloudFunction.CustomerSelfUpdate;
    const payload = {
      organization,
      customer,
    };

    await createCloudFunctionCaller(handler, payload)();

    dispatch(
      enqueueNotification({
        variant: NotifVariant.Success,
        message: i18n.t(NotificationMessage.CustomerProfileUpdated),
      })
    );
  } catch (error) {
    dispatch(
      enqueueNotification({
        variant: NotifVariant.Error,
        message: i18n.t(NotificationMessage.CustomerProfileError),
      })
    );
  }
};

export const customerSelfRegister: {
  (paylod: CustomerBase & { registrationCode: string }): (
    ...params: Parameters<FirestoreThunk>
  ) => Promise<{ id: string; secretKey: string }>;
} =
  ({ registrationCode, ...customer }) =>
  async (dispatch) => {
    try {
      const organization = getOrganization();

      const handler = CloudFunction.CustomerSelfRegister;
      const payload = {
        organization,
        customer,
        registrationCode,
      };

      const res = await createCloudFunctionCaller(handler, payload)();
      const { id, secretKey } = res.data;

      dispatch(
        enqueueNotification({
          variant: NotifVariant.Success,
          message: i18n.t(NotificationMessage.CustomerProfileRegistered),
        })
      );
      return {
        id,
        secretKey,
      };
    } catch (error) {
      dispatch(
        enqueueNotification({
          variant: NotifVariant.Error,
          message: i18n.t(NotificationMessage.Error),
        })
      );
      return { id: "", secretKey: "" };
    }
  };

/**
 * Keeps track of calendar events created by customer
 */
export const createCalendarEvents =
  ({
    monthStr,
    secretKey,
    eventUids,
  }: {
    monthStr: string;
    secretKey: Customer["secretKey"];
    eventUids: string[];
  }): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      const docRef = doc(
        db,
        getBookingsPath(getOrganization()),
        secretKey,
        BookingSubCollection.Calendar,
        monthStr
      );
      await setDoc(docRef, { uids: eventUids });
      // show success message
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.SlotsAddedToCalendar),
          variant: NotifVariant.Success,
        })
      );
    } catch (error) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.Error),
          variant: NotifVariant.Error,
        })
      );
    }
  };

/**
 * Send email of ics file
 */
interface sendICSFile {
  (payload: {
    icsFile: string;
    email: string;
    secretKey: Customer["secretKey"];
    name: Customer["name"];
    displayName: OrganizationData["displayName"];
  }): FirestoreThunk;
}

export const sendICSFile: sendICSFile =
  ({ icsFile, email, secretKey, displayName = __organization__, name = "" }) =>
  async (dispatch) => {
    try {
      const handler = CloudFunction.SendEmail;
      const payload: Omit<
        ClientEmailPayload[EmailType.SendCalendarFile],
        "organization"
      > = {
        // to: email,
        type: EmailType.SendCalendarFile,
        customer: {
          name,
          /** @TODO surname */
          surname: "",
          secretKey,
          email,
        },
        displayName,
        attachments: {
          filename: "bookedSlots.ics",
          content: icsFile,
        },
      };

      await createCloudFunctionCaller(handler, payload)();

      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.EmailSent),
          variant: NotifVariant.Success,
        })
      );
    } catch (error) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.Error),
          variant: NotifVariant.Error,
        })
      );
    }
  };
