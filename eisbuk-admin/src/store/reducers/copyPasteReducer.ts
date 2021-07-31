import { Slot } from "eisbuk-shared";

import { Action } from "@/enums/Redux";

import { CopyPasteState } from "@/types/store";

const defaultState = {
  day: null,
  week: null,
};

interface CopyPastePayload {
  [Action.CopySlotDay]: CopyPasteState["day"];
  [Action.CopySlotWeek]: CopyPasteState["week"];
  [Action.DeleteSlotFromClipboard]: Slot<"id">["id"];
  [Action.AddSlotToClipboard]: Slot<"id">;
}

type CopyPasteActionTypes =
  | Action.CopySlotDay
  | Action.CopySlotWeek
  | Action.DeleteSlotFromClipboard
  | Action.AddSlotToClipboard;

interface CopyPasteAction<A extends CopyPasteActionTypes> {
  type: A;
  payload: CopyPastePayload[A];
}

export const copyPasteReducer = (
  state: CopyPasteState = defaultState,
  action: CopyPasteAction<any>
): CopyPasteState => {
  switch (action.type) {
    case Action.CopySlotDay:
      return {
        ...state,
        day: action.payload as CopyPastePayload[Action.CopySlotDay],
      };
    case Action.CopySlotWeek:
      return {
        ...state,
        week: action.payload as CopyPastePayload[Action.CopySlotWeek],
      };
    case Action.DeleteSlotFromClipboard:
      return {
        ...state,
        week: {
          ...state.week!,
          slots: state.week!.slots.filter(
            (slot) =>
              slot.id !==
              (action.payload as CopyPastePayload[Action.DeleteSlotFromClipboard])
          ),
        },
      };
    case Action.AddSlotToClipboard:
      return {
        ...state,
        week: {
          ...state.week!,
          slots: [
            ...(state.week?.slots || []),
            action.payload as CopyPastePayload[Action.AddSlotToClipboard],
          ],
        },
      };
    default:
      return state;
  }
};

export default copyPasteReducer;
