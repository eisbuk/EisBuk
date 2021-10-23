import i18n from "i18next";

import { Customer, Collection, OrgSubCollection } from "eisbuk-shared";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { ORGANIZATION } from "@/config/envInfo";

import {
  enqueueNotification,
  showErrSnackbar,
} from "@/store/actions/appActions";

/**
 * Creates firestore async thunk:
 * - updates the customer in firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param customer to update in firestore
 * @returns async thunk
 */
export const updateCustomer = (customer: Customer): FirestoreThunk => async (
  dispatch,
  getState,
  { getFirebase }
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...updatedData } = customer;

  const firebase = getFirebase();

  try {
    await firebase
      .firestore()
      .collection(Collection.Organizations)
      .doc(ORGANIZATION)
      .collection(OrgSubCollection.Customers)
      .doc(id)
      .set(updatedData);
    dispatch(
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: `${customer.name} ${customer.surname} ${i18n.t(
          "Notification.Updated"
        )}`,
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
export const deleteCustomer = (customer: Customer): FirestoreThunk => async (
  dispatch,
  _,
  { getFirebase }
) => {
  const firebase = getFirebase();

  try {
    await firebase
      .firestore()
      .collection(Collection.Organizations)
      .doc(ORGANIZATION)
      .collection(OrgSubCollection.Customers)
      .doc(customer.id)
      .set({ deleted: true }, { merge: true });

    dispatch(
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: `${customer.name} ${customer.surname} ${i18n.t(
          "Notification.Removed"
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
