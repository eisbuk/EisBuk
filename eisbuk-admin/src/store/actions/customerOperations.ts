import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  getFirestore,
  setDoc,
} from "@firebase/firestore";
import i18n from "i18next";

import {
  Collection,
  OrgSubCollection,
  CustomerLoose,
  CustomerBase,
} from "eisbuk-shared";

import { NotifVariant } from "@/enums/store";
import { NotificationMessage } from "@/enums/translations";

import { FirestoreThunk } from "@/types/store";

import { getOrganization } from "@/lib/getters";

import {
  enqueueNotification,
  showErrSnackbar,
} from "@/store/actions/appActions";

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
export const updateCustomer = (
  customer: CustomerLoose
): FirestoreThunk => async (dispatch) => {
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

    await setDoc(docRef, updatedData);
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
export const deleteCustomer = (
  customer: CustomerBase
): FirestoreThunk => async (dispatch) => {
  try {
    const db = getFirestore();
    const docRef = doc(db, getCustomersCollPath(), customer.id);

    await deleteDoc(docRef);

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
