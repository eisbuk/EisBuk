import { Customer, Slot, BookingInfo } from "eisbuk-shared";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { ORGANIZATION } from "@/config/envInfo";

import {
  enqueueSnackbar,
  closeSnackbar,
  showErrSnackbar,
} from "@/store/actions/appActions";

/** @TEMP */
import React from "react";
import { Button } from "@material-ui/core";
import { SlotOperation } from "@/types/slotOperations";
/** @TEMP */

/**
 * Creates firestore async thunk:
 * - dispatches subscribe to slot (used to slot for current athlete)
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param bookingId athletes secret key (bookings are grouped that way)
 * @param slot slot which to subscribe to, extended with duration the athlete is subscribing for
 * @returns async thunk
 */
export const subscribeToSlot = (
  bookingId: string,
  slot: BookingInfo
): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  const firebase = getFirebase();

  try {
    await firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("bookings")
      .doc(bookingId)
      .collection("data")
      .doc(slot.id)
      .set(slot);

    dispatch(
      enqueueSnackbar({
        key: new Date().getTime() + Math.random(),
        message: "Prenotazione effettuata",
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

/**
 * Creates firestore async thunk:
 * - unsubscribes the current athlete from given slot in firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param bookingId athletes secret key (bookings are grouped that way)
 * @param slot slot which to subscribe to, extended with duration the athlete is subscribing for
 */
export const unsubscribeFromSlot = (
  bookingId: string,
  slot: Parameters<SlotOperation>[0]
): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  const firebase = getFirebase();

  try {
    await firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("bookings")
      .doc(bookingId)
      .collection("data")
      .doc(slot.id)
      .delete();

    dispatch(
      enqueueSnackbar({
        message: "Prenotazione rimossa",
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
  } catch (err) {
    dispatch(
      enqueueSnackbar({
        key: new Date().getTime() + Math.random(),
        message: "Errore nel rimuovere la prenotazione",
        options: {
          variant: NotifVariant.Error,
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
  }
};

interface MarkAbsenteePayload {
  slot: Pick<Slot, "id">;
  user: Pick<Customer, "id">;
  isAbsent: boolean;
}

/**
 * Creates firestore async thunk:
 * - updates the attendance for given athlete for given slot in firestore (updated back using real time DB)
 * - in case of failure enqueues error snackbar
 * @param slot in which the athlete's attendance is being marked
 * @param user athlete
 * @param isAbsent boolean
 * @returns async thunk
 */
export const markAbsentee = ({
  slot,
  user,
  isAbsent,
}: MarkAbsenteePayload): FirestoreThunk => async (
  dispatch,
  getState,
  { getFirebase }
) => {
  const firebase = getFirebase();

  try {
    await firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("slots")
      .doc(slot.id)
      .set({ absentees: { [user.id]: isAbsent } }, { merge: true });
  } catch {
    showErrSnackbar();
  }
};
