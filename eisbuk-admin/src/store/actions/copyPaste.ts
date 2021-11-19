import { DateTime } from "luxon";
import { collection, getFirestore, writeBatch, doc } from "@firebase/firestore";

import {
  Collection,
  OrgSubCollection,
  SlotInterface,
  SlotsById,
  luxon2ISODate,
  fromISO,
} from "eisbuk-shared";

import { getOrganization } from "@/lib/getters";

import { Action } from "@/enums/store";

import { FirestoreThunk, SlotsWeek } from "@/types/store";

import { showErrSnackbar } from "./appActions";

/**
 * Creates Redux 'remove slot from clipboard' action for copyPaste reducer
 * @param id of the slot to remove from clipboard
 * @returns Redux action object
 */
export const deleteSlotFromClipboard = (
  id: SlotInterface["id"]
): {
  type: Action;
  payload: SlotInterface["id"];
} => ({
  type: Action.DeleteSlotFromClipboard,
  payload: id,
});

/**
 * Creates Redux 'add slot to clipboard' action for copyPaste reducer
 * @param slot the full slot record to add to clipboard
 * @returns Redux action object
 */
export const addSlotToClipboard = (
  slot: SlotInterface
): {
  type: Action;
  payload: SlotInterface;
} => ({
  type: Action.AddSlotToClipboard,
  payload: slot,
});

/**
 * Creates Redux action to add a complete day of slots to clipboard for copyPaste reducer
 * @param slotDay a record of all of the slots for a given day
 * @returns Redux action object
 */
export const setSlotDayToClipboard = (
  slotDay: SlotsById
): {
  type: Action;
  payload: SlotsById;
} => ({
  type: Action.CopySlotDay,
  payload: slotDay,
});

/**
 * Creates Redux action to add a complete week of slots to clipboard for copyPaste reducer
 * @param slotDay a record containing a week start time and a list of all the slots for a given week
 * @returns Redux action object
 */
export const setSlotWeekToClipboard = (
  slotWeek: SlotsWeek
): {
  type: Action;
  payload: SlotsWeek;
} => ({
  type: Action.CopySlotWeek,
  payload: slotWeek,
});

// #region updatedActions

/**
 * Creates Redux action to add a complete day of slots to clipboard for copyPaste reducer
 * @returns Redux action object
 */
export const copySlotsDay = (date: DateTime): FirestoreThunk => async (
  dispatch,
  getState
) => {
  const dateISO = luxon2ISODate(date);
  const monthStr = dateISO.substr(0, 7);

  // get slots day to copy from store
  const slotsByDay = getState().firestore.data.slotsByDay;
  // exit if no slots in store
  if (!slotsByDay) return;

  const slotsMonth = slotsByDay[monthStr];
  // exit if no slots for given month
  if (!slotsMonth) return;

  const slots = slotsMonth[dateISO];
  // exit if slot day empty
  if (!slots || !Object.values(slots).length) return;

  // add slots to clipboard
  dispatch(setSlotDayToClipboard(slots));
};

/**
 * Creates Redux action to add a complete week of slots to clipboard for copyPaste reducer
 * @returns Redux action object
 */
export const copySlotsWeek = (): FirestoreThunk => async (
  dispatch,
  getState
) => {
  // get full store state
  const state = getState();

  // get week start and date keys
  const weekStart = state.app.calendarDay;
  const weekStartISO = luxon2ISODate(weekStart);
  const monthStr = weekStartISO.substr(0, 7);

  // get slots week to copy from store
  const slotsByDay = state.firestore.data.slotsByDay;
  // exit if no slots in store
  if (!slotsByDay) return;

  const slotsMonth = slotsByDay[monthStr];
  // exit if no slots for given month
  if (!slotsMonth) return;

  // process slots month to return an array of slots for given week
  const slots = Array(7)
    .fill(weekStart)
    .reduce((acc, baseDate, i) => {
      const dateISO = luxon2ISODate(baseDate.plus({ days: i }));
      // get slots for a given day of the week (if any)
      const slotsInADay = slotsMonth[dateISO] || {};
      // return slots in a day flattened with acc array
      return [...acc, ...Object.values(slotsInADay)];
    }, [] as SlotInterface[]);

  dispatch(setSlotWeekToClipboard({ slots, weekStart }));
};

const getSlotsCollectionPath = () =>
  `${Collection.Organizations}/${getOrganization()}/${OrgSubCollection.Slots}`;

/**
 * Creates Redux action to paste the day of slots from clipboard to a new day
 * @returns Redux action object
 */
export const pasteSlotsDay = (newDate: DateTime): FirestoreThunk => async (
  dispatch,
  getState
) => {
  try {
    const db = getFirestore();

    // get slots day to copy from store
    const slotsToCopy = getState().copyPaste.day;
    // exit early if no slots in clipboard
    if (!slotsToCopy) return;

    // get iso date for new slots
    const date = luxon2ISODate(newDate);

    // add updated slots to firestore
    const slotsCollRef = collection(db, getSlotsCollectionPath());
    const batch = writeBatch(db);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.values(slotsToCopy).forEach(({ id, ...slotData }) => {
      const newSlotRef = doc(slotsCollRef);
      batch.set(newSlotRef, { ...slotData, date });
    });
    await batch.commit();
  } catch {
    dispatch(showErrSnackbar);
  }
};

/**
 * Creates Redux action to paste a week of slots from clipboard to new week (starting with provided date)
 * @returns Redux action object
 */
export const pasteSlotsWeek = (
  newWeekStart: DateTime
): FirestoreThunk => async (dispatch, getState) => {
  try {
    const db = getFirestore();

    const weekToPaste = getState().copyPaste.week;

    // exit early if no week in clipboard
    if (!weekToPaste) return;

    // get slots day to copy from store
    const { weekStart, slots } = weekToPaste;

    // exit early if no slots or week start in clipboard
    if (!slots || !weekStart) return;

    // calculate jump in weeks
    const jump = newWeekStart.diff(weekStart, ["weeks"]).toObject().weeks!;

    // update each slot with new date and set up for firestore dispatching
    const slotsCollRef = collection(db, getSlotsCollectionPath());
    const batch = writeBatch(db);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    slots.forEach(({ id, date: oldDate, ...slotData }) => {
      const luxonDate = fromISO(oldDate).plus({ weeks: jump });
      const date = luxon2ISODate(luxonDate);
      const newSlotRef = doc(slotsCollRef);
      batch.set(newSlotRef, { ...slotData, date });
    });

    await batch.commit();
  } catch {
    dispatch(showErrSnackbar);
  }
};

// #endregion updatedActions
