import { DateTime } from "luxon";
import { isEqual } from "lodash";
import { v5 as uuidv5 } from "uuid";

import {
  SlotInterface,
  SlotsByDay,
  SlotsById,
  luxon2ISODate,
  fromISO,
} from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getOrganization } from "@/lib/getters";

import { ButtonContextType } from "@/enums/components";
import { Action, NotifVariant } from "@/enums/store";

import { FirestoreThunk, SlotsWeek } from "@/types/store";

import { enqueueNotification } from "@/features/notifications/actions";

import { getSlotsPath, collection, doc, writeBatch } from "@/utils/firestore";

/**
 * Creates Redux 'remove slot from clipboard' action for copyPaste reducer
 * @param id of the slot to remove from clipboard
 * @returns Redux action object
 */
export const deleteSlotFromClipboard = (
  id: SlotInterface["id"],
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
  slot: SlotInterface,
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
  slotDay: SlotsById,
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
  slotWeek: SlotsWeek,
): {
  type: Action;
  payload: SlotsWeek;
} => ({
  type: Action.CopySlotWeek,
  payload: slotWeek,
});

// #region pasteGuard

/**
 * How long a paste target stays locked after its commit resolved. It covers the second
 * click of a double-click, and a click made because only the first few pasted slots
 * have appeared: the slots are aggregated one by one, and they can take a few seconds.
 */
export const PASTE_COOLDOWN_MS = 10000;

type PasteType = ButtonContextType.Day | ButtonContextType.Week;

/**
 * Targets with a paste in flight or in cooldown. Keyed by target, not global:
 * pasting to another day/week while a previous commit is pending is legitimate.
 */
const lockedPasteTargets = new Set<string>();

const getPasteKey = (type: PasteType, date: DateTime) =>
  `${type}/${luxon2ISODate(date)}`;

export const isPasteLocked = (type: PasteType, date: DateTime) =>
  lockedPasteTargets.has(getPasteKey(type, date));

/**
 * Commits the batch unless the same target is already locked. The lock is taken
 * synchronously, before any `await`, so that concurrent dispatches can't both pass.
 *
 * The lock is released right away on failure (allowing for a retry) and after
 * `PASTE_COOLDOWN_MS` on success. An offline commit stays pending, keeping the lock:
 * the write is queued and will still land, so another paste would be a duplicate.
 *
 * @returns `true` if the batch was committed, `false` if the target was locked
 */
const commitPasteOnce = async (
  type: PasteType,
  date: DateTime,
  createBatch: () => { commit: () => Promise<unknown> },
) => {
  if (isPasteLocked(type, date)) return false;

  const key = getPasteKey(type, date);
  lockedPasteTargets.add(key);

  try {
    await createBatch().commit();
    setTimeout(() => lockedPasteTargets.delete(key), PASTE_COOLDOWN_MS);
    return true;
  } catch (err) {
    lockedPasteTargets.delete(key);
    throw err;
  }
};

/** Namespace of the ids of pasted slots (see `getPastedSlotId`). Changing it would change the ids. */
const PASTED_SLOT_ID_NAMESPACE = "0f1c4a52-7d3e-4b8a-9c61-2e5d8a7b3f10";

/**
 * The same slot pasted to the same date always gets the same id, so a paste repeated in
 * another tab or device writes to the same document instead of creating a duplicate.
 *
 * The source id is hashed to keep the length fixed: a pasted slot can be copied and pasted
 * again without limit. Hashing the whole source id (rather than removing the date of a
 * previously pasted slot) keeps the ids of different slots different: a slot and its edited
 * copy pasted to one date are two slots.
 */
const getPastedSlotId = (date: string, sourceId: string) =>
  `${date}-${uuidv5(sourceId, PASTED_SLOT_ID_NAMESPACE)}`;

/** What makes two slots the same slot. Lodash `isEqual` doesn't depend on key order. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSlotContent = ({ id, ...content }: SlotInterface) => ({
  ...content,
  categories: [...content.categories].sort(),
});

/**
 * Prepares the slots for writing, leaving out each slot which:
 * - has an id which already exists: an admin may have edited that slot, or athletes booked it,
 *   and writing to it would overwrite that
 * - has the same content as a slot on the target date, or as a previous slot in the clipboard:
 *   a duplicate which got here from some other source shouldn't spread any further
 *
 * Only the loaded months can be checked. The slots page loads the months around the
 * displayed date, so this includes the paste target.
 *
 * @param slots the slots from the clipboard, each one with its target date
 * @param slotsByDay the loaded slots
 */
const getSlotsToWrite = (
  slots: SlotInterface[],
  slotsByDay: Record<string, SlotsByDay> | null | undefined,
) => {
  const knownSlots = Object.values(slotsByDay || {})
    .flatMap((month) => Object.values(month))
    .flatMap((day) => Object.values(day));
  const knownIds = new Set(knownSlots.map(({ id }) => id));

  return slots.reduce((slotsToWrite, slot) => {
    const id = getPastedSlotId(slot.date, slot.id);
    const content = getSlotContent(slot);
    const isDuplicate = [...knownSlots, ...slotsToWrite].some(
      (other) =>
        other.date === slot.date && isEqual(getSlotContent(other), content),
    );
    return knownIds.has(id) || isDuplicate
      ? slotsToWrite
      : [...slotsToWrite, { ...slot, id }];
  }, [] as SlotInterface[]);
};

// #endregion pasteGuard

// #region updatedActions

/**
 * The `id` is written too (usually the job of the `addIdToSlot` trigger): if a paste in another
 * tab has just created the document, this write replaces it and no create trigger will run again.
 */
const createPasteBatch = (
  db: Parameters<typeof writeBatch>[0],
  slots: SlotInterface[],
) => {
  const slotsCollRef = collection(db, getSlotsPath(getOrganization()));
  const batch = writeBatch(db);
  slots.forEach((slot) => batch.set(doc(slotsCollRef, slot.id), slot));
  return batch;
};

/**
 * Creates Redux action to add a complete day of slots to clipboard for copyPaste reducer
 * @returns Redux action object
 */
export const copySlotsDay =
  (date: DateTime): FirestoreThunk =>
  async (dispatch, getState) => {
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
export const copySlotsWeek =
  (): FirestoreThunk => async (dispatch, getState) => {
    // get full store state
    const state = getState();

    // get week start and date keys
    const weekStart = state.app.calendarDay.startOf("week");
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

/**
 * Creates Redux action to paste the day of slots from clipboard to a new day
 * @returns Redux thunk, resolving to `true` if any slots were written (see `getSlotsToWrite`)
 */
export const pasteSlotsDay =
  (newDate: DateTime): FirestoreThunk<boolean> =>
  async (dispatch, getState, { getFirestore }) => {
    try {
      const db = getFirestore();

      // get slots day to copy from store
      const slotsToCopy = getState().copyPaste.day;
      // exit early if no slots in clipboard
      if (!slotsToCopy || !Object.keys(slotsToCopy).length) return false;

      // get iso date for new slots
      const date = luxon2ISODate(newDate);

      const slotsToWrite = getSlotsToWrite(
        Object.values(slotsToCopy).map((slot) => ({ ...slot, date })),
        getState().firestore.data.slotsByDay,
      );
      if (!slotsToWrite.length) return false;

      return await commitPasteOnce(ButtonContextType.Day, newDate, () =>
        createPasteBatch(db, slotsToWrite),
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.CopyPasteErrorDay),
          variant: NotifVariant.Error,
          error: err as Error,
        }),
      );
      return false;
    }
  };

/**
 * Creates Redux action to paste a week of slots from clipboard to new week (starting with provided date)
 * @returns Redux thunk, resolving to `true` if any slots were written (see `getSlotsToWrite`)
 */
export const pasteSlotsWeek =
  (newWeekStart: DateTime): FirestoreThunk<boolean> =>
  async (dispatch, getState, { getFirestore }) => {
    try {
      const db = getFirestore();

      const weekToPaste = getState().copyPaste.week;

      // exit early if no week in clipboard
      if (!weekToPaste) return false;

      // get slots day to copy from store
      const { weekStart, slots } = weekToPaste;

      // exit early if no slots or week start in clipboard
      if (!slots?.length || !weekStart) return false;

      // calculate jump in weeks
      const jump = newWeekStart.diff(weekStart, ["weeks"]).toObject().weeks!;

      const slotsToWrite = getSlotsToWrite(
        slots.map((slot) => ({
          ...slot,
          date: luxon2ISODate(fromISO(slot.date).plus({ weeks: jump })),
        })),
        getState().firestore.data.slotsByDay,
      );
      if (!slotsToWrite.length) return false;

      return await commitPasteOnce(ButtonContextType.Week, newWeekStart, () =>
        createPasteBatch(db, slotsToWrite),
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.CopyPasteErrorWeek),
          variant: NotifVariant.Error,
          error: err as Error,
        }),
      );
      return false;
    }
  };

// #endregion updatedActions
