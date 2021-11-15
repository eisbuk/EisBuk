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

/**
 * Creates firestore async thunk:
 * - updates the customer in firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param customer to update in firestore
 * @returns async thunk
 */
export const updateCustomer = (
  customer: CustomerLoose
): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...updatedData } = customer;

  try {
    const firebase = getFirebase();

    const customersRef = firebase
      .firestore()
      .collection(Collection.Organizations)
      .doc(getOrganization())
      .collection(OrgSubCollection.Customers);

    // if the `id` is defined, we want to reference the existing customer doc in the db
    // else the server will generate a uuid for a customer
    const customerDoc = id ? customersRef.doc(id) : customersRef.doc();

    await customerDoc.set(updatedData, { merge: true });

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
): FirestoreThunk => async (dispatch, _, { getFirebase }) => {
  try {
    const firebase = getFirebase();

    await firebase
      .firestore()
      .collection(Collection.Organizations)
      .doc(getOrganization())
      .collection(OrgSubCollection.Customers)
      .doc(customer.id)
      .set({ deleted: true }, { merge: true });

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
