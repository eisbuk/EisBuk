import { DateTime } from "luxon";

import { Slot } from "eisbuk-shared";

import { Action } from "@/enums/store";

import { SlotDay, SlotWeek } from "@/types/store";

/**
 * Creates Redux 'remove slot from clipboard' action for copyPaste reducer
 * @param id of the slot to remove from clipboard
 * @returns Redux action object
 */
export const deleteSlotFromClipboard = (
  id: Slot<"id">["id"]
): {
  type: Action;
  payload: Slot<"id">["id"];
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
  slot: Slot<"id">
): {
  type: Action;
  payload: Slot<"id">;
} => ({
  type: Action.AddSlotToClipboard,
  payload: slot,
});

/**
 * Creates Redux action to add a complete day of slots to clipboard for copyPaste reducer
 * @param slotDay a record of all of the slots for a given day
 * @returns Redux action object
 */
export const copySlotDay = (
  slotDay: SlotDay
): {
  type: Action;
  payload: SlotDay;
} => ({
  type: Action.CopySlotDay,
  payload: slotDay,
});

/**
 * Creates Redux action to add a complete week of slots to clipboard for copyPaste reducer
 * @param slotDay a record containing a week start time and a list of all the slots for a given week
 * @returns Redux action object
 */
export const copySlotWeek = (
  slotWeek: SlotWeek
): {
  type: Action;
  payload: SlotWeek;
} => ({
  type: Action.CopySlotWeek,
  payload: slotWeek,
});

// #region updatedActions
/**
 * These action are updated versions of existing `copySlotDay` and `copySlotWeek` actions.
 * They're written is such a way that only the start date needs to be passed
 * and the slots data will be read from the store to reduce data needed for action calls.
 * @TODO These are just scaffolding for functions used to test those functions being called from new `SlotOperationButtons`,
 * should write and test these functions when working on new atmoic component integration to admin `slots` view
 * @TODO Upon integration rename to `copySlotDay` / `copySlotWeek` rather than `newCopySlotDay` / `newCopySlotWeek`
 * and delete the old versions of same functions
 */
/**
 * Payload for each respective `BulkSlotsAction` action
 */
interface CopySlotsPayload {
  [Action.CopySlotDay]: SlotDay;
  [Action.CopySlotWeek]: SlotWeek;
  [Action.PasteSlotDay]: SlotDay;
  [Action.PasteSlotWeek]: SlotWeek;
}

/**
 * Generic function interface used to type `copySlotDay` | `copySlotWeek` action creators
 */
interface BulkSlotsAction<
  A extends
    | Action.CopySlotDay
    | Action.CopySlotWeek
    | Action.PasteSlotDay
    | Action.PasteSlotWeek
> {
  (date: DateTime): {
    type: A;
    payload: CopySlotsPayload[A];
  };
}

/**
 * Creates Redux action to add a complete day of slots to clipboard for copyPaste reducer
 * @returns Redux action object
 */
export const newCopySlotDay: BulkSlotsAction<Action.CopySlotDay> = () => ({
  type: Action.CopySlotDay,
  payload: {} as any,
});

/**
 * Creates Redux action to add a complete week of slots to clipboard for copyPaste reducer
 * @returns Redux action object
 */
export const newCopySlotWeek: BulkSlotsAction<Action.CopySlotWeek> = () => ({
  type: Action.CopySlotWeek,
  payload: {} as any,
});

/**
 * Creates Redux action to paste the day of slots from clipboard to a new day
 * @returns Redux action object
 */
export const newPasteSlotDay: BulkSlotsAction<Action.CopySlotDay> = () => ({
  type: Action.CopySlotDay,
  payload: {} as any,
});

/**
 * Creates Redux action to paste a week of slots from clipboard to new week (starting with provided date)
 * @returns Redux action object
 */
export const newPasteSlotWeek: BulkSlotsAction<Action.CopySlotWeek> = () => ({
  type: Action.CopySlotWeek,
  payload: {} as any,
});

// #endregion updatedActions
