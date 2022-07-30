import { DateTime } from "luxon";

import { __isStorybook__, __storybookDate__ } from "@/lib/constants";

import { Action } from "@/enums/store";

import { AppState, AppReducerAction, AppAction } from "@/types/store";

export const defaultState = {
  notifications: [],
  calendarDay: __isStorybook__
    ? // If the env is storybook, set the standard date to keep chromatic consistent
      DateTime.fromISO(__storybookDate__)
    : // In dev/production, the date is current date
      DateTime.local(),
};

const appReducer = (
  state: AppState = defaultState,
  action: AppReducerAction<AppAction>
): AppState => {
  switch (action.type) {
    case Action.ChangeDay:
      return {
        ...state,
        calendarDay: (action as AppReducerAction<Action.ChangeDay>).payload,
      };

    default:
      return state;
  }
};

export default appReducer;
