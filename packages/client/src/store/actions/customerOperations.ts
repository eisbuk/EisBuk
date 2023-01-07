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
          message: i18n.t(NotificationMessage.CustomerUpdated, {
            name: customer.name,
            surname: customer.surname,
          }),
          variant: NotifVariant.Success,
        })
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.CustomerUpdateError, {
            name: customer.name,
            surname: customer.surname,
          }),
          variant: NotifVariant.Error,
          error: err as Error,
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
          message: i18n.t(NotificationMessage.CustomerDeleted, {
            name: customer.name,
            surname: customer.surname,
          }),
          variant: NotifVariant.Success,
        })
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.CustomerDeleteError, {
            name: customer.name,
            surname: customer.surname,
          }),
          variant: NotifVariant.Error,
          error: err as Error,
        })
      );
    }
  };

export const extendBookingDate =
  (customer: Customer, extendedDate: string): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      await setDoc(
        doc(db, getCustomersPath(getOrganization()), customer.id),
        { extendedDate },
        { merge: true }
      );

      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.BookingDateExtended, {
            name: customer.name,
            surname: customer.surname,
          }),
          variant: NotifVariant.Success,
        })
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.BookingDateExtendedError, {
            name: customer.name,
            surname: customer.surname,
          }),
          variant: NotifVariant.Error,
          error: err as Error,
        })
      );
    }
  };
