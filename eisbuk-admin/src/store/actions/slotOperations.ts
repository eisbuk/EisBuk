import i18n from "i18next";
import { DateTime } from "luxon";

import { Slot } from "eisbuk-shared";

import { SlotFormValues } from "@/lib/data";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";
import { SlotOperation } from "@/types/slotOperations";

import { ORGANIZATION } from "@/config/envInfo";

import {
  enqueueNotification,
  showErrSnackbar,
  setNewSlotTime,
} from "@/store/actions/appActions";
import { SlotInterval } from "@/types/temp";

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
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: i18n.t("Notification.SlotAdded"),
        closeButton: true,
        options: {
          variant: NotifVariant.Success,
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
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: i18n.t("Notification.SlotRemoved"),
        closeButton: true,
        options: {
          variant: NotifVariant.Success,
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
export const editSlot = (
  slot: Omit<Slot<"id">, "date">
): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
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
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: i18n.t("Notification.SlotUpdated"),
        closeButton: true,
        options: {
          variant: NotifVariant.Success,
        },
      })
    );
  } catch {
    showErrSnackbar();
  }
};

// #region newOperations
/**
 * These are new action written in accordance with new (`SlotOperationButtons`) components.
 * We're using them for tests right now, but
 * @TODO update to full functionality before integrating with new admin view
 */

/**
 * Deletes slot with given id from firestore and (in effect) local store
 * @param slotId od slot to delete
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteSlot = (slotId: Slot<"id">["id"]): void => {
  /** @TODO should call to `deleteSlots` function and pass `slotId` */
};

/**
 * Deletes slots for the whole day from firestore and (in effect) local store
 * @param date of the slots day to delete
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteSlotsDay = (date: DateTime): void => {
  /** @TODO should read all slot ids for given date and call to `deleteSlots` function and pass ids for given slots */
};

/**
 * Deletes slots for the whole week from firestore and (in effect) local store
 * @param date of the first day of the slots week to delete
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteSlotsWeek = (date: DateTime): void => {
  /** @TODO should read all slot ids for given a week starting with given date and call to `deleteSlots` function and pass ids for given slots */
};

/**
 * Takes in slot values from `SlotForm` for new slot and updates the db.
 * @param payload `SlotForm` values + slot date
 */
export const createNewSlot = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  payload: SlotFormValues & { date: DateTime }
): void => {};

/**
 * Takes in slot values from `SlotForm` for existing slot and updates the entry in db.
 * @param payload `SlotForm` values + slot date
 */
export const updateSlot = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  payload: SlotFormValues & { date: DateTime; id: string }
): void => {};

/**
 * Takes in slotId, customerId, bookedInterval and updates entry in db.
 * @param payload slotId, customerId and bookedInterval
 */
export const bookInterval = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  payload: { slotId: string; customerId: string; bookedInterval: SlotInterval }
): void => {};

/**
 * Takes in slotId, customerId and updates entry to booked = null in db.
 * @param payload slotId, customerId of cancelled booking
 */
export const cancelBooking = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  payload: { slotId: string; customerId: string }
): void => {};
// #endregion newOperations
