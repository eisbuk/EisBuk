import { Slot } from "eisbuk-shared";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";
import { SlotOperation } from "@/types/slotOperations";

import { ORGANIZATION } from "@/config/envInfo";

import {
  enqueueSnackbar,
  closeSnackbar,
  showErrSnackbar,
  setNewSlotTime,
} from "@/store/actions/appActions";

/** @TEMP */
import React from "react";
import { Button } from "@material-ui/core";
/** @TEMP */

/**
 * Creates firestore async thunk:
 * - creates slot entries in firestore
 * - updates new slot time in local store on success
 * - enqueues error snackbar on failure
 * @param slots a list of slots to create in firestore
 * @returns async thunk
 */
export const createSlots = (slots: Slot[]): FirestoreThunk => async (
  dispatch,
  getState,
  { getFirebase }
) => {
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
    showErrSnackbar();
  }
};

/**
 * Creates firestore async thunk:
 * - deletes selected slots from firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param slots a list of slots to delete from firestore
 * @returns async thunk
 */
export const deleteSlots = (
  slots: Parameters<SlotOperation>[0][]
): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
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
    showErrSnackbar();
  }
};

/**
 * Creates firestore async thunk:
 * - edits existing slot in firestore
 * - enqueues success/error snackbar depending on the outcome of firestore operation
 * @param slot updated slot
 * @returns async thunk
 */
export const editSlot = (slot: Omit<Slot, "date">): FirestoreThunk => async (
  dispatch,
  getState,
  { getFirebase }
) => {
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
    showErrSnackbar();
  }
};
