import { DateTime } from "luxon";
import { Timestamp } from "@google-cloud/firestore";

import {
  Collection,
  OrgSubCollection,
  SlotInterface,
  SlotInterval,
} from "eisbuk-shared";

import { SlotFormValues } from "@/lib/data";

import { FirestoreThunk } from "@/types/store";

import { ORGANIZATION } from "@/config/envInfo";

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
  const date = { seconds: luxonDate.toSeconds() } as Timestamp;
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
  const date = { seconds: luxonDate.toSeconds() } as Timestamp;
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
