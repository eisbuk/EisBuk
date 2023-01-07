import { DateTime } from "luxon";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
} from "@firebase/firestore";

import { SlotInterface, SlotInterval } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getOrganization } from "@/lib/getters";

import { SlotFormValues } from "@/lib/data";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { enqueueNotification } from "@/features/notifications/actions";
import { getSlotDocPath, getSlotsPath } from "@/utils/firestore";

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
export const createNewSlot =
  (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    {
      date,
      intervals: intervalsArr,
      ...slotData
    }: SlotFormValues & { date: string }
  ): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      const slotsCollRef = collection(db, getSlotsPath(getOrganization()));

      const intervals = intervalsArr.reduce(
        (acc, { startTime, endTime }) => ({
          ...acc,
          [`${startTime}-${endTime}`]: { startTime, endTime },
        }),
        {} as Record<string, SlotInterval>
      );

      const newSlot: Omit<SlotInterface, "id"> = {
        ...slotData,
        date,
        intervals,
      };

      await addDoc(slotsCollRef, newSlot);

      // show success notification
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.SlotAdded),
          variant: NotifVariant.Success,
        })
      );
    } catch (err) {
      // show error notification if operation failed
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.SlotAddError),
          variant: NotifVariant.Error,
          error: err as Error,
        })
      );
    }
  };

/**
 * Takes in slot values from `SlotForm` for existing slot and updates the entry in db.
 * @param payload `SlotForm` values + slot date
 */
export const updateSlot =
  (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    {
      date,
      intervals: intervalsArr,
      id: slotId,
      ...slotData
    }: SlotFormValues & { date: string; id: string }
  ): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      const slotDocRef = doc(db, getSlotDocPath(getOrganization(), slotId));

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
          message: i18n.t(NotificationMessage.SlotUpdated),
          variant: NotifVariant.Success,
        })
      );
    } catch (err) {
      // show error notification if operation failed
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.SlotUpdateError),
          variant: NotifVariant.Error,
          error: err as Error,
        })
      );
    }
  };

/**
 * Deletes slot with given id from firestore and (in effect) local store
 * @param slotId od slot to delete
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteSlot =
  (slotId: SlotInterface["id"]): FirestoreThunk =>
  async (dispatch) => {
    try {
      const db = getFirestore();
      const slotDocRef = doc(db, getSlotDocPath(getOrganization(), slotId));

      await deleteDoc(slotDocRef);

      // show success notification
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.SlotDeleted),
          variant: NotifVariant.Success,
        })
      );
    } catch (err) {
      // show error notification if operation failed
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.SlotDeleteError),
          variant: NotifVariant.Error,
          error: err as Error,
        })
      );
    }
  };
// #endregion newOperations
