import {
  collection,
  DocumentData,
  DocumentReference,
  doc,
  getFirestore,
  setDoc,
} from "@firebase/firestore";

import { CustomerLoose, Customer } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { getOrganization } from "@/lib/getters";

import { enqueueNotification } from "@/features/notifications/actions";

import { getCustomersPath } from "@/utils/firestore";

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
        docRef = doc(db, getCustomersPath(getOrganization()), id);
      } else {
        const customersCollRef = collection(
          db,
          getCustomersPath(getOrganization())
        );
        docRef = doc(customersCollRef);
      }

      await setDoc(docRef, updatedData, { merge: true });
      dispatch(
        enqueueNotification({
          message: `${customer.name} ${customer.surname} ${i18n.t(
            NotificationMessage.Updated
          )}`,
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
 * Creates firestore async thunk:
 * - deletes the customer from firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param customer to delete from firestore
 * @returns async thunk
 */
export const deleteCustomer =
  (customer: Customer): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      const docRef = doc(db, getCustomersPath(getOrganization()), customer.id);

      await setDoc(docRef, { deleted: true }, { merge: true });

      dispatch(
        enqueueNotification({
          message: `${customer.name} ${customer.surname} ${i18n.t(
            NotificationMessage.Removed
          )}`,
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

export const extendBookingDate =
  (customerId: string, extendedDate: string): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      await setDoc(
        doc(db, getCustomersPath(getOrganization()), customerId),
        { extendedDate },
        { merge: true }
      );

      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.BookingDateExtended),
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
