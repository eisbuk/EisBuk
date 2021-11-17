import { DateTime } from "luxon";
import i18n from "i18next";

import {
  Collection,
  OrgSubCollection,
  SlotInterface,
  SlotInterval,
} from "eisbuk-shared";

import { getOrganization } from "@/lib/getters";

import { SlotFormValues } from "@/lib/data";

import { NotifVariant } from "@/enums/store";
import { NotificationMessage } from "@/enums/translations";

import { FirestoreThunk } from "@/types/store";

import { enqueueNotification, showErrSnackbar } from "./appActions";

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
    date,
    intervals: intervalsArr,
    ...slotData
  }: SlotFormValues & { date: string }
): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  try {
    const db = getFirebase().firestore();

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
      .doc(getOrganization())
      .collection(OrgSubCollection.Slots)
      .doc()
      .set(newSlot);

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
    dispatch(showErrSnackbar);
  }
};

/**
 * Takes in slot values from `SlotForm` for existing slot and updates the entry in db.
 * @param payload `SlotForm` values + slot date
 */
export const updateSlot = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  {
    date,
    intervals: intervalsArr,
    id,
    ...slotData
  }: SlotFormValues & { date: string; id: string }
): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  try {
    const db = getFirebase().firestore();

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
      .doc(getOrganization())
      .collection(OrgSubCollection.Slots)
      .doc(id)
      .set(updatedSlot);

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
    dispatch(showErrSnackbar);
  }
};

/**
 * Deletes slot with given id from firestore and (in effect) local store
 * @param slotId od slot to delete
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteSlot = (
  slotId: SlotInterface["id"]
): FirestoreThunk => async (dispatch, getState, { getFirebase }) => {
  try {
    await getFirebase()
      .firestore()
      .collection(Collection.Organizations)
      .doc(getOrganization())
      .collection(OrgSubCollection.Slots)
      .doc(slotId)
      .delete();

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
    dispatch(showErrSnackbar);
  }
};
// #endregion newOperations
