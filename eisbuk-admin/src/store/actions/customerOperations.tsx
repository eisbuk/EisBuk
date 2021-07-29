import { NotifVariant } from "@/enums/Redux";

import {
  CustomerInStore,
  Dispatch,
  GetState,
  GetFirebase,
} from "@/types/store";

import { ORGANIZATION } from "@/config/envInfo";

import {
  enqueueSnackbar,
  showErrSnackbar,
  closeSnackbar,
} from "./notifications";

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
export const updateCustomer = (customer: CustomerInStore) => async (
  dispatch: Dispatch,
  getState: GetState,
  { getFirebase }: GetFirebase
): Promise<void> => {
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
export const deleteCustomer = (customer: CustomerInStore) => async (
  dispatch: Dispatch,
  { getFirebase }: GetFirebase
): Promise<void> => {
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
