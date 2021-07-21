import { DateTime } from "luxon";

import { Action } from "@/enums/Redux";
import { AppState, Notification } from "@/types/store";

const defaultState = {
  notifications: [],
  calendarDay: DateTime.local(),
  newSlotTime: null,
};

/** @TODO rewrite reducers to adhere to standard (type, payload) action  */

export interface AppActionInterface {
  type: Action;
  notification: Notification;
  key: number;
  /** @TEMP below */
  dismissAll: any;
  payload: any;
}

const appReducer = (
  state: AppState = defaultState,
  action: AppActionInterface
): AppState => {
  switch (action.type) {
    case Action.EnqueueSnackbar:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            key: action.key,
            ...action.notification,
          },
        ],
      };

    case Action.CloseSnackbar:
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          action.dismissAll || notification.key === action.key
            ? { ...notification, dismissed: true }
            : { ...notification }
        ),
      };

    case Action.RemoveSnackbar:
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.key !== action.key
        ),
      };

    case Action.ChangeDay:
      return {
        ...state,
        calendarDay: action.payload,
      };

    case Action.SetSlotTime:
      return {
        ...state,
        newSlotTime: action.payload,
      };

    default:
      return state;
  }
};

export default appReducer;
