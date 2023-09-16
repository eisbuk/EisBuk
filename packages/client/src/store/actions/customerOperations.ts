import { DateTime } from "luxon";

import { CustomerLoose, Customer } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { getOrganization } from "@/lib/getters";

import { enqueueNotification } from "@/features/notifications/actions";

import {
  getCustomersPath,
  collection,
  FirestoreDocVariant,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getBookedSlotsPath,
} from "@/utils/firestore";

/**
 * Creates firestore async thunk:
 * - updates the customer in firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param customer to update in firestore
 * @returns async thunk
 */
export const updateCustomer =
  (customer: CustomerLoose): FirestoreThunk =>
  async (dispatch, _, { getFirestore }) => {
    try {
      const db = getFirestore();

      const { id, ...updatedData } = customer;
      let docRef: FirestoreDocVariant;
      if (id) {
        docRef = doc(db, getCustomersPath(getOrganization()), id);
        await setDoc(docRef, updatedData, { merge: true });
      } else {
        const customersCollRef = collection(
          db,
          getCustomersPath(getOrganization())
        );
        await addDoc(customersCollRef, updatedData);
      }

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
  async (dispatch, _, { getFirestore }) => {
    try {
      const organization = getOrganization();
      const db = getFirestore();
      const docRef = doc(db, getCustomersPath(organization), customer.id);

      // Check if customer has bookings in the future
      const allBookings = await getDocs(
        collection(db, getBookedSlotsPath(organization, customer.secretKey))
      );
      const hasFutureBookings = allBookings.docs.some((doc) => {
        const { date } = doc.data();
        const cond = date >= DateTime.now().toISODate();
        return cond;
      });

      if (hasFutureBookings) {
        dispatch(
          enqueueNotification({
            message: i18n.t(
              NotificationMessage.CustomerDeleteErrorFutureBookings,
              {
                name: customer.name,
                surname: customer.surname,
              }
            ),
            variant: NotifVariant.Error,
          })
        );
        return;
      }

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
  async (dispatch, _, { getFirestore }) => {
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
