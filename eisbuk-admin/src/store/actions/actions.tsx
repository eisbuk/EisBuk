import React from "react";
import { Button } from "@material-ui/core";
import firebase from "firebase";
import { DateTime } from "luxon";
import { Timestamp } from "@google-cloud/firestore";

import { Action, NotifVariant } from "@/enums/Redux";

import {
  CustomerInStore,
  Dispatch,
  GetState,
  Notification,
  SlotDay,
  SlotWeek,
} from "@/types/store";
import { Slot, Customer } from "@/types/firestore";

import { functionsZone, ORGANIZATION } from "@/config/envInfo";

interface GetFirebase {
  getFirebase: () => typeof firebase;
}

const enqueueSnackbar = (notification: Notification) => {
  const key = notification.key || new Date().getTime() + Math.random();

  return {
    type: Action.EnqueueSnackbar,
    notification: {
      ...notification,
      key,
    },
  };
};

const closeSnackbar = (key: Notification["key"]) => ({
  type: Action.CloseSnackbar,
  dismissAll: !key, // dismiss all if no key has been defined
  key,
});

export const removeSnackbar = (key: Notification["key"]) => ({
  type: Action.RemoveSnackbar,
  key,
});

export const signOut = () => {
  return (
    dispatch: Dispatch,
    getState: GetState,
    { getFirebase }: GetFirebase
  ) => {
    const firebase = getFirebase();
    firebase
      .auth()
      .signOut()
      .then(() => {
        dispatch(
          enqueueSnackbar({
            key: new Date().getTime() + Math.random(),
            message: "Hai effettuato il logout",
            options: {
              variant: NotifVariant.Success,
            },
          })
        );
      })
      .catch((err: Error) => {
        dispatch(
          enqueueSnackbar({
            key: new Date().getTime() + Math.random(),
            message: "Si è verificato un errore",
            options: {
              variant: NotifVariant.Error,
            },
          })
        );
      });
  };
};

export const queryUserAdminStatus = () => {
  return async (
    dispatch: Dispatch,
    getState: GetState,
    { getFirebase }: GetFirebase
  ) => {
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
  };
};

export const changeCalendarDate = (date: DateTime) => ({
  type: Action.ChangeDay,
  payload: date,
});

export const setNewSlotTime = (time: Timestamp) => ({
  type: Action.SetSlotTime,
  payload: time,
});

export const createSlots = (slots: Slot[]) => (
  dispatch: Dispatch,
  getState: GetState,
  { getFirebase }: GetFirebase
) => {
  const db = getFirebase().firestore();
  const batch = db.batch();
  let newSlotTime = slots[slots.length - 1];
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
  batch
    .commit()
    .then(() => {
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
    })
    .catch(showErrSnackbar(dispatch));
};

export const editSlot = (slot: Omit<Slot, "date">) => {
  return (
    dispatch: Dispatch,
    getState: GetState,
    { getFirebase }: GetFirebase
  ) => {
    const db = getFirebase().firestore();
    db.collection("organizations")
      .doc(ORGANIZATION)
      .collection("slots")
      .doc(slot.id)
      .update({
        categories: slot.categories,
        type: slot.type,
        durations: slot.durations,
        notes: slot.notes,
      })
      .then(() => {
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
      })
      .catch(showErrSnackbar(dispatch));
  };
};

export const subscribeToSlot = (bookingId: string, slot: Slot<"id">) => {
  return (
    dispatch: Dispatch,
    getState: GetState,
    { getFirebase }: GetFirebase
  ) => {
    const firebase = getFirebase();
    firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("bookings")
      .doc(bookingId)
      .collection("data")
      .doc(slot.id)
      .set(slot)
      .then(() => {
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
      })
      .catch(showErrSnackbar(dispatch));
  };
};

export const unsubscribeFromSlot = (bookingId: string, slot: Slot) => {
  return (
    dispatch: Dispatch,
    getState: GetState,
    { getFirebase }: GetFirebase
  ) => {
    const firebase = getFirebase();
    firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("bookings")
      .doc(bookingId)
      .collection("data")
      .doc(slot.id)
      .delete()
      .then(() => {
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
      })
      .catch((err: Error) => {
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
      });
  };
};

export const deleteSlots = (slots: Slot[]) => {
  return async (
    dispatch: Dispatch,
    getState: GetState,
    { getFirebase }: GetFirebase
  ) => {
    const db = getFirebase().firestore();
    const writeBatch = db.batch();

    for (var i = 0; i < slots.length; i++) {
      const slotReference = db
        .collection("organizations")
        .doc(ORGANIZATION)
        .collection("slots")
        .doc(slots[i].id);
      writeBatch.delete(slotReference);
    }
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
  };
};

interface MarkAbsenteePayload {
  slot: Pick<Slot, "id">;
  user: Pick<Customer, "id">;
  isAbsent: boolean;
}

export const markAbsentee = ({ slot, user, isAbsent }: MarkAbsenteePayload) => {
  return (
    dispatch: Dispatch,
    getState: GetState,
    { getFirebase }: GetFirebase
  ) => {
    const db = getFirebase().firestore();
    db.collection("organizations")
      .doc(ORGANIZATION)
      .collection("slots")
      .doc(slot.id)
      .set({ absentees: { [user.id]: isAbsent } }, { merge: true });
  };
};

export const deleteCustomer = (customer: CustomerInStore) => {
  return (
    dispatch: Dispatch,
    getState: GetState,
    { getFirebase }: GetFirebase
  ) => {
    const firebase = getFirebase();
    firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("customers")
      .doc(customer.id)
      .delete()
      .then(() => {
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
      })
      .catch(showErrSnackbar(dispatch));
  };
};

const showErrSnackbar = (dispatch: Dispatch) => (err: Error) => {
  dispatch(
    enqueueSnackbar({
      message: "Errore",
      options: {
        variant: NotifVariant.Error,
      },
    })
  );
};

export const updateCustomer = (customer: CustomerInStore) => {
  return (
    dispatch: Dispatch,
    getState: GetState,
    { getFirebase }: GetFirebase
  ) => {
    const { id, ...updatedData } = { ...customer };

    const firebase = getFirebase();
    firebase
      .firestore()
      .collection("organizations")
      .doc(ORGANIZATION)
      .collection("customers")
      .doc(customer.id || undefined)
      .set(updatedData)
      .then(() => {
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
      })
      .catch(showErrSnackbar(dispatch));
  };
};

export const copySlotDay = (slotDay: SlotDay) => ({
  type: Action.CopySlotDay,
  payload: slotDay,
});

export const copySlotWeek = (slotWeek: SlotWeek) => ({
  type: Action.CopySlotWeek,
  payload: slotWeek,
});

export const deleteSlotFromClipboard = (id: Slot<"id">["id"]) => ({
  type: Action.DeleteSlotFromClipboard,
  payload: id,
});

export const addSlotToClipboard = (id: Slot<"id">) => ({
  type: Action.AddSlotToClipboard,
  payload: id,
});
