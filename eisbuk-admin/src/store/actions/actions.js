import React from "react";
import Button from "@material-ui/core/Button";
import { functionsZone } from "../../config/envInfo";

import {
  ENQUEUE_SNACKBAR,
  CLOSE_SNACKBAR,
  REMOVE_SNACKBAR,
  IS_ADMIN_RECEIVED,
  CHANGE_DAY,
  COPY_SLOT_DAY,
  COPY_SLOT_WEEK,
  SET_SLOT_TIME,
  DELETE_SLOT_FROM_CLIPBOARD,
  ADD_SLOT_TO_CLIPBOARD,
} from "./action-types";
import { ORGANIZATION } from "../../config/envInfo";

export const enqueueSnackbar = (notification) => {
  const key = notification.options && notification.options.key;

  return {
    type: ENQUEUE_SNACKBAR,
    notification: {
      ...notification,
      key: key || new Date().getTime() + Math.random(),
    },
  };
};

export const closeSnackbar = (key) => ({
  type: CLOSE_SNACKBAR,
  dismissAll: !key, // dismiss all if no key has been defined
  key,
});

export const removeSnackbar = (key) => ({
  type: REMOVE_SNACKBAR,
  key,
});

export const signOut = () => {
  return (dispatch, getState, { getFirebase }) => {
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
              variant: "success",
            },
          })
        );
      })
      .catch((err) => {
        dispatch(
          enqueueSnackbar({
            key: new Date().getTime() + Math.random(),
            message: "Si è verificato un errore",
            options: {
              variant: "error",
            },
          })
        );
      });
  };
};

export const queryUserAdminStatus = () => {
  return async (dispatch, getState, { getFirebase }) => {
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
        type: IS_ADMIN_RECEIVED,
        payload: { uid: auth.uid, amIAdmin: resp.data.amIAdmin },
      });
    }
  };
};

export const changeCalendarDate = (date) => ({
  type: CHANGE_DAY,
  payload: date,
});

export const setNewSlotTime = (time) => ({
  type: SET_SLOT_TIME,
  payload: time,
});

export const createSlots = (slots) => {
  return (dispatch, getState, { getFirebase }) => {
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
              variant: "success",
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
};

export const editSlot = (slot) => {
  return (dispatch, getState, { getFirebase }) => {
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
              variant: "success",
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

export const subscribeToSlot = (bookingId, slot) => {
  return (dispatch, getState, { getFirebase }) => {
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
              variant: "success",
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

export const unsubscribeFromSlot = (bookingId, slot) => {
  return (dispatch, getState, { getFirebase }) => {
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
              variant: "success",
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
      .catch((err) => {
        dispatch(
          enqueueSnackbar({
            key: new Date().getTime() + Math.random(),
            message: "Errore nel rimuovere la prenotazione",
            options: {
              variant: "error",
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

export const deleteSlots = (slots) => {
  return async (dispatch, getState, { getFirebase }) => {
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
          variant: "success",
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

export const markAbsentee = ({ slot, user, isAbsent }) => {
  return (dispatch, getState, { getFirebase }) => {
    const db = getFirebase().firestore();
    db.collection("organizations")
      .doc(ORGANIZATION)
      .collection("slots")
      .doc(slot.id)
      .set({ absentees: { [user.id]: isAbsent } }, { merge: true });
  };
};

export const deleteCustomer = (customer) => {
  return (dispatch, getState, { getFirebase }) => {
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
              variant: "success",
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

const showErrSnackbar = (dispatch) => (err) => {
  dispatch(
    enqueueSnackbar({
      message: "Errore",
      options: {
        variant: "error",
      },
    })
  );
};

export const updateCustomer = (customer) => {
  return (dispatch, getState, { getFirebase }) => {
    const updatedData = Object.assign({}, customer);
    delete updatedData.id;
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

export const copySlotDay = (slotDay) => ({
  type: COPY_SLOT_DAY,
  payload: slotDay,
});

export const copySlotWeek = (slotWeek) => ({
  type: COPY_SLOT_WEEK,
  payload: slotWeek,
});

export const deleteSlotFromClipboard = (id) => ({
  type: DELETE_SLOT_FROM_CLIPBOARD,
  payload: id,
});

export const addSlotToClipboard = (id) => ({
  type: ADD_SLOT_TO_CLIPBOARD,
  payload: id,
});
