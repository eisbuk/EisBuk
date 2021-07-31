import { NotifVariant } from "@/enums/store";

import { CustomerInStore, FirestoreThunk } from "@/types/store";

import { ORGANIZATION } from "@/config/envInfo";

import {
  enqueueSnackbar,
  showErrSnackbar,
  closeSnackbar,
} from "@/store/actions/appActions";

/** @TEMP */
import React from "react";
import { Button } from "@material-ui/core";
/** @TEMP */

/**
 * Creates firestore async thunk:
 * - updates the customer in firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param customer to update in firestore
 * @returns async thunk
 */
export const updateCustomer = (
  customer: CustomerInStore
): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...updatedData } = { ...customer };

  const firebase = getFirebase();

  try {
    await firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("customers")
      .doc(customer.id || undefined)
      .set(updatedData);
    dispatch(
      enqueueSnackbar({
        key: new Date().getTime() + Math.random(),
        message: `${customer.name} ${customer.surname} aggiornato`,
        options: {
          action: (key) => (
            <Button
              variant="outlined"
              onClick={() => dispatch(closeSnackbar(key))}
            >
              OK
            </Button>
          ),
        },
      })
    );
  } catch {
    showErrSnackbar();
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
  customer: CustomerInStore
): FirestoreThunk => async (dispatch, _, { getFirebase }) => {
  const firebase = getFirebase();

  try {
    await firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("customers")
      .doc(customer.id)
      .delete();

    dispatch(
      enqueueSnackbar({
        key: new Date().getTime() + Math.random(),
        message: `${customer.name} ${customer.surname} rimosso`,
        options: {
          variant: NotifVariant.Success,
          action: (key) => (
            <Button
              variant="outlined"
              onClick={() => dispatch(closeSnackbar(key))}
            >
              OK
            </Button>
          ),
        },
      })
    );
  } catch {
    showErrSnackbar();
  }
};
