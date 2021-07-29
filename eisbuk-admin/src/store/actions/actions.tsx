import React from "react";
import { Button } from "@material-ui/core";
import firebase from "firebase";
import { DateTime } from "luxon";
import { Timestamp } from "@google-cloud/firestore";

import { Slot, Customer } from "eisbuk-shared";

import { Action, NotifVariant } from "@/enums/Redux";

import { Dispatch, GetState } from "@/types/store";

import { functionsZone, ORGANIZATION } from "@/config/envInfo";

interface GetFirebase {
  getFirebase: () => typeof firebase;
}

export const signOut = () => async (
  dispatch: Dispatch,
  getState: GetState,
  { getFirebase }: GetFirebase
): Promise<void> => {
  const firebase = getFirebase();
  try {
    await firebase.auth().signOut();

    dispatch(
      enqueueSnackbar({
        key: new Date().getTime() + Math.random(),
        message: "Hai effettuato il logout",
        options: {
          variant: NotifVariant.Success,
        },
      })
    );
  } catch (err) {
    dispatch(
      enqueueSnackbar({
        key: new Date().getTime() + Math.random(),
        message: "Si è verificato un errore",
        options: {
          variant: NotifVariant.Error,
        },
      })
    );
  }
};

export const queryUserAdminStatus = () => async (
  dispatch: Dispatch,
  getState: GetState,
  { getFirebase }: GetFirebase
): Promise<void> => {
  try {
    const firebase = getFirebase();
    const resp = await firebase
      .app()
      .functions(functionsZone)
      .httpsCallable("amIAdmin")({
      organization: ORGANIZATION,
    });

    const auth = getState().firebase.auth;

    if (auth.uid) {
      dispatch({
        type: Action.IsAdminReceived,
        payload: { uid: auth.uid, amIAdmin: resp.data.amIAdmin },
      });
    }
  } catch (err) {
    console.error(err);
  }
};

export const changeCalendarDate = (
  date: DateTime
): {
  type: Action;
  payload: DateTime;
} => ({
  type: Action.ChangeDay,
  payload: date,
});

export const setNewSlotTime = (
  time: Timestamp
): {
  type: Action;
  payload: Timestamp;
} => ({
  type: Action.SetSlotTime,
  payload: time,
});

export const createSlots = (slots: Slot[]) => async (
  dispatch: Dispatch,
  getState: GetState,
  { getFirebase }: GetFirebase
): Promise<void> => {
  const db = getFirebase().firestore();
  const batch = db.batch();

  const newSlotTime = slots[slots.length - 1];

  for (const slot of slots) {
    batch.set(
      db
        .collection("organizations")
        .doc(ORGANIZATION)
        .collection("slots")
        .doc(),
      slot
    );
  }
  try {
    await batch.commit();

    dispatch(
      enqueueSnackbar({
        key: new Date().getTime() + Math.random(),
        message: "Slot Aggiunto",
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

    dispatch(setNewSlotTime(newSlotTime.date));
  } catch {
    showErrSnackbar(dispatch);
  }
};

export const editSlot = (slot: Omit<Slot, "date">) => async (
  dispatch: Dispatch,
  getState: GetState,
  { getFirebase }: GetFirebase
): Promise<void> => {
  const db = getFirebase().firestore();
  try {
    await db
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("slots")
      .doc(slot.id)
      .update({
        categories: slot.categories,
        type: slot.type,
        durations: slot.durations,
        notes: slot.notes,
      });

    dispatch(
      enqueueSnackbar({
        key: new Date().getTime() + Math.random(),
        message: "Slot Aggiornato",
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
    showErrSnackbar(dispatch);
  }
};

export const subscribeToSlot = (bookingId: string, slot: Slot<"id">) => async (
  dispatch: Dispatch,
  getState: GetState,
  { getFirebase }: GetFirebase
): Promise<void> => {
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
    showErrSnackbar(dispatch);
  }
};

export const unsubscribeFromSlot = (bookingId: string, slot: Slot) => async (
  dispatch: Dispatch,
  getState: GetState,
  { getFirebase }: GetFirebase
): Promise<void> => {
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

export const deleteSlots = (slots: Slot[]) => async (
  dispatch: Dispatch,
  getState: GetState,
  { getFirebase }: GetFirebase
): Promise<void> => {
  const db = getFirebase().firestore();
  const writeBatch = db.batch();

  for (let i = 0; i < slots.length; i++) {
    const slotReference = db
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("slots")
      .doc(slots[i].id);
    writeBatch.delete(slotReference);
  }

  try {
    await writeBatch.commit();

    dispatch(
      enqueueSnackbar({
        key: new Date().getTime() + Math.random(),
        message: "Slot Eliminato",
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
    console.error(err);
  }
};

interface MarkAbsenteePayload {
  slot: Pick<Slot, "id">;
  user: Pick<Customer, "id">;
  isAbsent: boolean;
}

export const markAbsentee = ({
  slot,
  user,
  isAbsent,
}: MarkAbsenteePayload) => async (
  dispatch: Dispatch,
  getState: GetState,
  { getFirebase }: GetFirebase
): Promise<void> => {
  const db = getFirebase().firestore();

  db.collection("organizations")
    .doc(ORGANIZATION)
    .collection("slots")
    .doc(slot.id)
    .set({ absentees: { [user.id]: isAbsent } }, { merge: true });
};
