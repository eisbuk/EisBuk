import { DateTime } from "luxon";
import { SnackbarKey } from "notistack";
import i18n from "i18next";

import { NotificationMessage } from "@/lib/notifications";

import { Action, NotifVariant } from "@/enums/store";

import { AppReducerAction, Notification } from "@/types/store";

import { store } from "@/store/index";

/**
 * Notification interface with optional key (as new key will be created in absence of provided one)
 */
type NotificationParam = Omit<Notification, "key"> & { key?: SnackbarKey };

/**
 * Creates Redux action to enqueue a new notification snackbar for appReducer
 * @param notification the full notification record (with key optional)
 * @returns Redux action object
 */
export const enqueueNotification = (
  notification: NotificationParam
): AppReducerAction<Action.EnqueueNotification> => {
  // if no key is provided, assign new key
  const key = notification.key || new Date().getTime() + Math.random();

  return {
    type: Action.EnqueueNotification,
    payload: {
      ...notification,
      key,
    },
  };
};

/**
 * Creates Redux action for appReducer to either:
 * - dismiss a single notification from notifications queue (if key provided)
 * - dismiss all notifications from notifications queue (if no key provided)
 * @param key notification key (empty to dismiss all notifications)
 * @returns Redux action object
 */
export const closeSnackbar = (
  key?: Notification["key"]
): AppReducerAction<Action.CloseSnackbar> => ({
  type: Action.CloseSnackbar,
  payload: key,
});

/**
 * Creates Redux action for appReducer to remove notification from queue
 * @param key of notification to remove from queue
 * @returns Redux action object
 */
export const removeSnackbar = (
  key: Notification["key"]
): AppReducerAction<Action.RemoveNotification> => ({
  type: Action.RemoveNotification,
  payload: key,
});

/**
 * Helper function: dispatches Redux action to enqueue error notification
 */
export const showErrSnackbar = (): void => {
  store.dispatch(
    enqueueNotification({
      message: i18n.t(NotificationMessage.Error),
      options: {
        variant: NotifVariant.Error,
      },
    })
  );
};

/**
 * Creates Redux action for appReducer to update calendar date
 * @param date calendar date to set
 * @returns Redux action object
 */
export const changeCalendarDate = (
  date: DateTime
): AppReducerAction<Action.ChangeDay> => ({
  type: Action.ChangeDay,
  payload: date,
});
