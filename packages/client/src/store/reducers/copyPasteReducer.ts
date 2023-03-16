import { Action } from "@/enums/store";

import {
  CopyPasteState,
  CopyPasteReducerAction,
  CopyPasteAction,
  ReducerFactory,
} from "@/types/store";

const defaultState: CopyPasteState = {
  day: null,
  week: null,
};

/**
 * A factory function returning a redux reducer for `copyPaste` state.
 * It is created using a factory rather than just creating the reducer as a variable
 * to enable us to pass `initialState`
 *
 * @param initialState (optional) state to be used as initial (fallback) state to the reducer. If not provided,
 * falls back to a locally defined `defaultState`.
 */
export const createCopyPasteReducer: ReducerFactory<
  CopyPasteState,
  CopyPasteReducerAction<CopyPasteAction>
> =
  (initialState = {}) =>
  (state = { ...defaultState, ...initialState }, action): CopyPasteState => {
    switch (action.type) {
      case Action.CopySlotDay:
        // copy a day's worth of slots
        const dayToAdd = (action as CopyPasteReducerAction<Action.CopySlotDay>)
          .payload;

        return {
          week: null,
          day: dayToAdd,
        };

      case Action.CopySlotWeek:
        // copy a week's worth of slots
        const weekToAdd = (
          action as CopyPasteReducerAction<Action.CopySlotWeek>
        ).payload;

        return {
          day: null,
          week: weekToAdd,
        };

      case Action.DeleteSlotFromClipboard:
        // delete single slot from slots in clipboard
        const slotIdToDelete = (
          action as CopyPasteReducerAction<Action.DeleteSlotFromClipboard>
        ).payload;

        return {
          ...state,
          week: {
            ...state.week!,
            slots: state.week!.slots.filter(
              (slot) => slot.id !== slotIdToDelete
            ),
          },
        };

      case Action.AddSlotToClipboard:
        // add single slot to existing slots in clipboard
        const slotToAdd = (
          action as CopyPasteReducerAction<Action.AddSlotToClipboard>
        ).payload;

        return {
          ...state,
          week: {
            ...state.week!,
            slots: [...(state.week?.slots || []), slotToAdd],
          },
        };

      default:
        return state;
    }
  };
