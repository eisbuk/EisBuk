import {
  collection,
  DocumentData,
  DocumentReference,
  doc,
  getFirestore,
  setDoc,
} from "@firebase/firestore";

import {
  Collection,
  OrgSubCollection,
  CustomerLoose,
  CustomerBase,
  Customer,
  EmailMessage,
  SMSMessage,
} from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { NotifVariant } from "@/enums/store";
import { SendBookingLinkMethod } from "@/enums/other";
import { CloudFunction } from "@/enums/functions";

import { FirestoreThunk } from "@/types/store";

import { getOrganization } from "@/lib/getters";

import {
  enqueueNotification,
  showErrSnackbar,
} from "@/store/actions/appActions";

import { getCustomersRecord } from "@/store/selectors/customers";

import { createCloudFunctionCaller } from "@/utils/firebase";

const getCustomersCollPath = () =>
  `${Collection.Organizations}/${getOrganization()}/${
    OrgSubCollection.Customers
  }`;

/**
 * Creates firestore async thunk:
 * - updates the customer in firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param customer to update in firestore
 * @returns async thunk
 */
export const updateCustomer =
  (customer: CustomerLoose): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();

      const { id, ...updatedData } = customer;
      let docRef: DocumentReference<DocumentData>;
      if (id) {
        docRef = doc(db, getCustomersCollPath(), id);
      } else {
        const customersCollRef = collection(db, getCustomersCollPath());
        docRef = doc(customersCollRef);
      }

      await setDoc(docRef, updatedData, { merge: true });
      dispatch(
        enqueueNotification({
          key: new Date().getTime() + Math.random(),
          message: `${customer.name} ${customer.surname} ${i18n.t(
            NotificationMessage.Updated
          )}`,
          options: {
            variant: NotifVariant.Success,
          },
          closeButton: true,
        })
      );
    } catch {
      dispatch(showErrSnackbar);
    }
  };

/**
 * Creates firestore async thunk:
 * - deletes the customer from firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param customer to delete from firestore
 * @returns async thunk
 */
export const deleteCustomer =
  (customer: CustomerBase): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      const docRef = doc(db, getCustomersCollPath(), customer.id);

      await setDoc(docRef, { deleted: true }, { merge: true });

      dispatch(
        enqueueNotification({
          key: new Date().getTime() + Math.random(),
          message: `${customer.name} ${customer.surname} ${i18n.t(
            NotificationMessage.Removed
          )}`,
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

interface SendBookingsLink {
  (payload: {
    customerId: Customer["id"];
    method: SendBookingLinkMethod;
    bookingsLink: string;
  }): FirestoreThunk;
}

export const sendBookingsLink: SendBookingsLink =
  ({ customerId, method, bookingsLink }) =>
  async (dispatch, getState) => {
    try {
      const { email, phone, name, secretKey } = getCustomersRecord(getState())[
        customerId
      ];

      const subject = "prenotazioni lezioni di Igor Ice Team";

      if (!secretKey) {
        // this should be unreachable
        // (email button should be disabled in case secret key or email are not provided)
        throw new Error();
      }

      const html = `<p>Ciao ${name},</p>
      <p>Ti inviamo un link per prenotare le tue prossime lezioni con ${getOrganization()}:</p>
      <a href="${bookingsLink}">Clicca qui per gestire le tue prenotazioni</a>`;

      const sms = `Ciao ${name},
      Ti inviamo un link per prenotare le tue prossime lezioni con ${getOrganization()}:
      ${bookingsLink}`;

      const config = {
        [SendBookingLinkMethod.Email]: {
          handler: CloudFunction.SendEmail,
          payload: {
            to: email,
            message: {
              html,
              subject,
            },
          } as EmailMessage,
          successMessage: i18n.t(NotificationMessage.EmailSent),
        },
        [SendBookingLinkMethod.SMS]: {
          handler: CloudFunction.SendSMS,
          payload: { to: phone, message: sms } as SMSMessage,
          successMessage: i18n.t(NotificationMessage.SMSSent),
        },
      };

      const { handler, payload, successMessage } = config[method];

      await createCloudFunctionCaller(handler, payload)();

      dispatch(
        enqueueNotification({
          key: new Date().getTime() + Math.random(),
          message: successMessage,
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

export const extendBookingDate =
  (customerId: string, extendedDate: string): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      await setDoc(
        doc(db, getCustomersCollPath(), customerId),
        { extendedDate },
        { merge: true }
      );

      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.BookingDateExtended),
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
