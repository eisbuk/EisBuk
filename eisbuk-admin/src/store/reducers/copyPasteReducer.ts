import { Action } from "@/enums/Redux";

import { CopyPasteState } from "@/types/store";

const defaultState = {
  day: null,
  week: null,
};

interface CopyPasteAction {
  type: Action;
  payload: CopyPasteState["day"] | CopyPasteState["week"];
}

export const copyPasteReducer = (
  state: CopyPasteState = defaultState,
  action: CopyPasteAction
) => {
  switch (action.type) {
    case Action.CopySlotDay:
      return { ...state, day: action.payload as CopyPasteState["day"] };
    case Action.CopySlotWeek:
      return { ...state, week: action.payload as CopyPasteState["day"] };
    default:
      return state;
  }
};

export default copyPasteReducer;
