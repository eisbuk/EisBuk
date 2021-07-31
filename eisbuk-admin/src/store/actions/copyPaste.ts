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
