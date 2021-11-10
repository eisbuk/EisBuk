import { deleteDoc, doc, getFirestore, setDoc } from "@firebase/firestore";
import i18n from "i18next";

import { Collection, Customer, OrgSubCollection } from "eisbuk-shared";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { ORGANIZATION } from "@/config/envInfo";

import {
  enqueueNotification,
  showErrSnackbar,
} from "@/store/actions/appActions";

const customersCollPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Customers}`;

/**
 * Creates firestore async thunk:
 * - updates the customer in firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param customer to update in firestore
 * @returns async thunk
 */
export const updateCustomer = (customer: Customer): FirestoreThunk => async (
  dispatch
) => {
  try {
    const db = getFirestore();

    const { id, ...updatedData } = customer;
    const docRef = doc(db, `${customersCollPath}/${id}`);

    await setDoc(docRef, updatedData);
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
  dispatch
) => {
  try {
    const db = getFirestore();
    const docRef = doc(db, `${customersCollPath}/${customer.id}`);

    await deleteDoc(docRef);

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
