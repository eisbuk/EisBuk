import { Action } from "@/enums/store";

import {
  CopyPasteState,
  CopyPasteReducerAction,
  CopyPasteAction,
} from "@/types/store";

const defaultState = {
  day: null,
  week: null,
};

export const copyPasteReducer = (
  state: CopyPasteState = defaultState,
  action: CopyPasteReducerAction<CopyPasteAction>
): CopyPasteState => {
  switch (action.type) {
    case Action.CopySlotDay:
      // copy a day's worth of slots
      const dayToAdd = (action as CopyPasteReducerAction<Action.CopySlotDay>)
        .payload;

      return {
        ...state,
        day: dayToAdd,
      };

    case Action.CopySlotWeek:
      // copy a week's worth of slots
      const weekToAdd = (action as CopyPasteReducerAction<Action.CopySlotWeek>)
        .payload;

      return {
        ...state,
        week: weekToAdd,
      };

    case Action.DeleteSlotFromClipboard:
      // delete single slot from slots in clipboard
      const slotIdToDelete = (action as CopyPasteReducerAction<Action.DeleteSlotFromClipboard>)
        .payload;

      return {
        ...state,
        week: {
          ...state.week!,
          slots: state.week!.slots.filter((slot) => slot.id !== slotIdToDelete),
        },
      };

    case Action.AddSlotToClipboard:
      // add single slot to existing slots in clipboard
      const slotToAdd = (action as CopyPasteReducerAction<Action.AddSlotToClipboard>)
        .payload;

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

export default copyPasteReducer;
