import { DateTime } from "luxon";

import { SlotInterface, SlotInterfaceLoose } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getOrganization } from "@/lib/getters";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { enqueueNotification } from "@/features/notifications/actions";
import {
  getSlotDocPath,
  getSlotsPath,
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
} from "@/utils/firestore";

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
 * A thunk used to create or update the slot in firestore.
 * If id is provided, the action is considered an update, otherwise a new slot (with firestore assigned id) is created.
 * @param payload slot data
 */
export const upsertSlot =
  (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { id, ...slot }: SlotInterfaceLoose
  ): FirestoreThunk =>
  async (dispatch, _, { getFirestore }) => {
    const isCreate = !id;

    try {
      const db = getFirestore();
      const organization = getOrganization();
      const slotsCollRef = collection(db, getSlotsPath(organization));

      if (isCreate) {
        await addDoc(slotsCollRef, slot);
      } else {
        const updatedSlot = { ...slot, id };
        const slotDocRef = doc(db, getSlotDocPath(organization, id));
        await setDoc(slotDocRef, updatedSlot);
      }

      const message = isCreate
        ? i18n.t(NotificationMessage.SlotAdded)
        : i18n.t(NotificationMessage.SlotUpdated);

      // show success notification
      dispatch(enqueueNotification({ message, variant: NotifVariant.Success }));
    } catch (err) {
      console.error(err);
      const message = isCreate
        ? i18n.t(NotificationMessage.SlotAddError)
        : i18n.t(NotificationMessage.SlotUpdateError);

      // show error notification if operation failed
      dispatch(
        enqueueNotification({
          message,
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
  async (dispatch, _, { getFirestore }) => {
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
