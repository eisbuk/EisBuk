import { DateTime } from "luxon";
import i18n from "i18next";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
} from "@firebase/firestore";

import {
  Collection,
  OrgSubCollection,
  SlotInterface,
  SlotInterval,
} from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";

import { SlotFormValues } from "@/lib/data";
import { NotificationMessage } from "@/lib/notifications";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { enqueueNotification, showErrSnackbar } from "./appActions";

import { luxonToFB } from "@/utils/date";

const slotsCollectionPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Slots}`;

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
): FirestoreThunk => async (dispatch) => {
  try {
    const db = getFirestore();
    const slotsCollRef = collection(db, slotsCollectionPath);

    const date = luxonToFB(luxonDate);
    const intervals = intervalsArr.reduce(
      (acc, { startTime, endTime }) => ({
        ...acc,
        [`${startTime}-${endTime}`]: { startTime, endTime },
      }),
      {} as Record<string, SlotInterval>
    );

    const newSlot: Omit<SlotInterface, "id"> = { ...slotData, date, intervals };

    await addDoc(slotsCollRef, newSlot);

    // show success notification
    dispatch(
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: i18n.t(NotificationMessage.SlotAdded),
        closeButton: true,
        options: {
          variant: NotifVariant.Success,
        },
      })
    );
  } catch {
    // show error notification if operation failed
    dispatch(showErrSnackbar());
  }
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
    id: slotId,
    ...slotData
  }: SlotFormValues & { date: DateTime; id: string }
): FirestoreThunk => async (dispatch) => {
  try {
    const db = getFirestore();
    const slotDocRef = doc(db, `${slotsCollectionPath}/${slotId}`);

    const date = luxonToFB(luxonDate);
    const intervals = intervalsArr.reduce(
      (acc, { startTime, endTime }) => ({
        ...acc,
        [`${startTime}-${endTime}`]: { startTime, endTime },
      }),
      {} as Record<string, SlotInterval>
    );
    const updatedSlot: SlotInterface = {
      ...slotData,
      date,
      intervals,
      id: slotId,
    };

    await setDoc(slotDocRef, updatedSlot);

    // show success notification
    dispatch(
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: i18n.t(NotificationMessage.SlotUpdated),
        closeButton: true,
        options: {
          variant: NotifVariant.Success,
        },
      })
    );
  } catch {
    // show error notification if operation failed
    dispatch(showErrSnackbar());
  }
};

/**
 * Deletes slot with given id from firestore and (in effect) local store
 * @param slotId od slot to delete
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteSlot = (
  slotId: SlotInterface["id"]
): FirestoreThunk => async (dispatch) => {
  try {
    const db = getFirestore();
    const slotDocRef = doc(db, `${slotsCollectionPath}/${slotId}`);

    await deleteDoc(slotDocRef);

    // show success notification
    dispatch(
      enqueueNotification({
        key: new Date().getTime() + Math.random(),
        message: i18n.t(NotificationMessage.SlotDeleted),
        closeButton: true,
        options: {
          variant: NotifVariant.Success,
        },
      })
    );
  } catch {
    // show error notification if operation failed
    dispatch(showErrSnackbar());
  }
};
// #endregion newOperations
