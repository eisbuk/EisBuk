import { DateTime } from "luxon";

import { __isStorybook__, __storybookDate__ } from "@/lib/constants";

import { Action } from "@/enums/store";

import { AppState, AppReducerAction, AppAction } from "@/types/store";

export const defaultState = {
  notifications: [],
  calendarDay:
    __isStorybook__ || process.env.BUILD_ENV === "test"
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
    case Action.EnqueueNotification:
      // new notification is recieved as payload
      const newNotification = (
        action as AppReducerAction<Action.EnqueueNotification>
      ).payload;

      return {
        ...state,
        // add new notification to notifications list
        notifications: [
          ...state.notifications,
          {
            ...newNotification,
          },
        ],
      };

    case Action.CloseSnackbar:
      // get key of notification to close
      const dismissKey = (action as AppReducerAction<Action.CloseSnackbar>)
        .payload;

      // close snackbar
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          // if key is provided, dismiss corresponding action (close snackbar)
          notification.key === dismissKey ||
          // if no key is provided, dismiss all notifications (close all snackbars)
          !dismissKey
            ? { ...notification, dismissed: true }
            : { ...notification }
        ),
      };

    case Action.RemoveNotification:
      // get key of notification to remove
      const removeKey = (action as AppReducerAction<Action.RemoveNotification>)
        .payload;

      return {
        ...state,
        // remove provided notification
        notifications: state.notifications.filter(
          (notification) => notification.key !== removeKey
        ),
      };

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
