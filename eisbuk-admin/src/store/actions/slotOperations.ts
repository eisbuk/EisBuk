import i18n from "i18next";
import { DateTime } from "luxon";
import { Timestamp } from "@google-cloud/firestore";

import {
  Collection,
  OrgSubCollection,
  SlotInterface,
  SlotInterval,
} from "eisbuk-shared";
import { DeprecatedSlot } from "eisbuk-shared/dist/types/deprecated/firestore";

import { SlotFormValues } from "@/lib/data";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";
import { SlotOperation } from "@/types/deprecated/slotOperations";

import { ORGANIZATION } from "@/config/envInfo";

import {
  enqueueNotification,
  showErrSnackbar,
  setNewSlotTime,
} from "@/store/actions/appActions";

/**
 * Creates firestore async thunk:
 * - creates slot entries in firestore
 * - updates new slot time in local store on success
 * - enqueues error snackbar on failure
 * @param slots a list of slots to create in firestore
 * @returns async thunk
 */
export const createSlots = (slots: DeprecatedSlot[]): FirestoreThunk => async (
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
  slot: Omit<DeprecatedSlot<"id">, "date">
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
        // durations: slot.durations,
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
  {
    date: luxonDate,
    intervals: intervalsArr,
    ...slotData
  }: SlotFormValues & { date: DateTime }
): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  const db = getFirebase().firestore();

  /** @TEMP until we figure out the Timestamp issue */
  const date = { seconds: luxonDate.toObject().second } as Timestamp;
  const intervals = intervalsArr.reduce(
    (acc, { startTime, endTime }) => ({
      ...acc,
      [`${startTime}-${endTime}`]: { startTime, endTime },
    }),
    {} as Record<string, SlotInterval>
  );

  const newSlot: Omit<SlotInterface, "id"> = { ...slotData, date, intervals };
  await db
    .collection(Collection.Organizations)
    .doc(ORGANIZATION)
    .collection(OrgSubCollection.Slots)
    .doc()
    .set(newSlot);
};

/**
 * Takes in slot values from `SlotForm` for existing slot and updates the entry in db.
 * @param payload `SlotForm` values + slot date
 */
export const updateSlot = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  {
    date: luxonDate,
    intervals: intervalsArr,
    id,
    ...slotData
  }: SlotFormValues & { date: DateTime; id: string }
): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  const db = getFirebase().firestore();

  /** @TEMP until we figure out the Timestamp issue */
  const date = { seconds: luxonDate.toObject().second } as Timestamp;
  const intervals = intervalsArr.reduce(
    (acc, { startTime, endTime }) => ({
      ...acc,
      [`${startTime}-${endTime}`]: { startTime, endTime },
    }),
    {} as Record<string, SlotInterval>
  );
  const updatedSlot: SlotInterface = { ...slotData, date, intervals, id };

  await db
    .collection(Collection.Organizations)
    .doc(ORGANIZATION)
    .collection(OrgSubCollection.Slots)
    .doc(id)
    .set(updatedSlot);
};

/**
 * Deletes slot with given id from firestore and (in effect) local store
 * @param slotId od slot to delete
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteSlot = (
  slotId: SlotInterface["id"]
): FirestoreThunk => async (dispatch, getState, { getFirebase }) =>
  await getFirebase()
    .firestore()
    .collection(Collection.Organizations)
    .doc(ORGANIZATION)
    .collection(OrgSubCollection.Slots)
    .doc(slotId)
    .delete();

// #endregion newOperations
