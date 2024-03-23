import { DateTime } from "luxon";

import { __isStorybook__, __storybookDate__ } from "@/lib/constants";

import { Action } from "@/enums/store";

import {
  AppState,
  AppReducerAction,
  AppAction,
  ReducerFactory,
} from "@/types/store";

const defaultState = {
  calendarDay: __isStorybook__
    ? // If the env is storybook, set the standard date to keep chromatic consistent
      DateTime.fromISO(__storybookDate__)
    : // In dev/production, the date is current date
      DateTime.local(),
  systemDate: {
    value: DateTime.now(),
    debug: false,
  },
};

/**
 * A factory function returning a redux reducer for `app` state.
 * It is created using a factory rather than just creating the reducer as a variable
 * to enable us to pass `initialState`
 *
 * @param initialState (optional) state to be used as initial (fallback) state to the reducer. If not provided,
 * falls back to a locally defined `defaultState`.
 */
export const createAppReducer: ReducerFactory<
  AppState,
  AppReducerAction<AppAction>
> =
  (initialState = {}) =>
  (state = { ...defaultState, ...initialState }, action) => {
    switch (action.type) {
      case Action.StoreSecretKey:
        return {
          ...state,
          secretKey: (action as AppReducerAction<Action.StoreSecretKey>)
            .payload,
        };

      case Action.RemoveSecretKey: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { secretKey, ...newState } = state;
        return newState;
      }

      case Action.ChangeDay:
        return {
          ...state,
          calendarDay: (action as AppReducerAction<Action.ChangeDay>).payload,
        };

      case Action.SetSystemDate:
        return {
          ...state,
          systemDate: {
            value: (action as AppReducerAction<Action.SetSystemDate>).payload,
            debug: true,
          },
        };

      case Action.ResetSystemDate:
        return {
          ...state,
          systemDate: {
            value: DateTime.now(),
            debug: false,
          },
        };

      default:
        return state;
    }
  };
