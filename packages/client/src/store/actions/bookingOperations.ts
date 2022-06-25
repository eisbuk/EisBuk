import { deleteDoc, doc, getFirestore, setDoc } from "@firebase/firestore";

import {
  BookingSubCollection,
  Collection,
  Customer,
  OrgSubCollection,
  SlotInterface,
  EmailMessage,
} from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getOrganization } from "@/lib/getters";

import { NotifVariant } from "@/enums/store";
import { CloudFunction } from "@/enums/functions";

import { FirestoreThunk } from "@/types/store";

import { createCloudFunctionCaller } from "@/utils/firebase";

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
        getBookingsPath(),
        secretKey,
        BookingSubCollection.Calendar,
        monthStr
      );
      await setDoc(docRef, { uids: eventUids });
      // show success message
      dispatch(
        enqueueNotification({
          key: new Date().getTime() + Math.random(),
          message: i18n.t(NotificationMessage.SlotsAddedToCalendar),
          closeButton: true,
          options: {
            variant: NotifVariant.Success,
          },
        })
      );
    } catch (error) {
      dispatch(showErrSnackbar);
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
  }): FirestoreThunk;
}

export const sendICSFile: sendICSFile =
  ({ icsFile, email, secretKey }) =>
  async (dispatch) => {
    try {
      const subject = "Calendario prenotazioni Igor Ice Team";

      const html = `<p>Ciao ${name},</p>
        <p>Ti inviamo un file per aggiungere le tue prossime lezioni con ${getOrganization()} al tuo calendario:</p>
        <a href="${icsFile}">Clicca qui per aggiungere le tue prenotazioni al tuo calendario</a>`;

      const handler = CloudFunction.SendEmail;
      const payload = {
        to: email,
        message: {
          html,
          subject,
          attachments: [
            {
              filename: "bookedSlots.ics",
              content: icsFile,
            },
          ],
        },
        secretKey: secretKey,
      } as EmailMessage;

      await createCloudFunctionCaller(handler, payload)();

      dispatch(
        enqueueNotification({
          key: new Date().getTime() + Math.random(),
          message: i18n.t(NotificationMessage.EmailSent),

          closeButton: true,
          options: {
            variant: NotifVariant.Success,
          },
        })
      );
    } catch (error) {
      dispatch(showErrSnackbar);
    }
  };
