import { DateTime } from "luxon";
import { Timestamp } from "@google-cloud/firestore";

import { Action, NotifVariant } from "@/enums/store";

import { Notification } from "@/types/store";

import { store } from "@/store/index";

// ***** Region Notifications ***** //
/**
 * Enqueue snackbar action creator return type (Redux action)
 */
interface EnqueueSnackbarAction {
  type: Action.EnqueueSnackbar;
  notification: Notification & Pick<Required<Notification>, "key">;
}

/**
 * Creates Redux action to enqueue a new notification snackbar for appReducer
 * @param notification the full notification record
 * @returns Redux action object
 */
export const enqueueSnackbar = (
  notification: Notification
): EnqueueSnackbarAction => {
  const key = notification.key || new Date().getTime() + Math.random();

  return {
    type: Action.EnqueueSnackbar,
    notification: {
      ...notification,
      key,
    },
  };
};

/**
 * Close snackbar action creator return type (Redux action)
 */
interface DismissSnackbarAction {
  type: Action.CloseSnackbar | Action.RemoveSnackbar;
  key: Notification["key"];
}

/**
 * Creates Redux action for appReducer to either:
 * - dismiss a single notification from notifications queue (if key provided)
 * - dismiss all notifications from notifications queue (if no key provided)
 * @param key notification key (empty to dismiss all notifications)
 * @returns Redux action object
 */
export const closeSnackbar = (
  key?: Notification["key"]
): DismissSnackbarAction => ({
  type: Action.CloseSnackbar,
  key,
});

/**
 * Creates Redux action for appReducer to remove notification from queue
 * @param key of notification to remove from queue
 * @returns Redux action object
 */
export const removeSnackbar = (
  key: Notification["key"]
): DismissSnackbarAction => ({
  type: Action.RemoveSnackbar,
  key,
});

/**
 * Helper function: dispatches Redux action to enqueue error notification
 */
export const showErrSnackbar = (): void => {
  store.dispatch(
    enqueueSnackbar({
      message: "Errore",
      options: {
        variant: NotifVariant.Error,
      },
    })
  );
};
// ***** End Region Notifications ***** //

// ***** Region Date and Time ***** //
/**
 * Creates Redux action for appReducer to update calendar date
 * @param date calendar date to set
 * @returns Redux action object
 */
export const changeCalendarDate = (
  date: DateTime
): {
  type: Action;
  payload: DateTime;
} => ({
  type: Action.ChangeDay,
  payload: date,
});

/**
 * Creates Redux action for appReducer to update new slot time
 * @param time to set as new slot time
 * @returns Redux action object
 */
export const setNewSlotTime = (
  time: Timestamp
): {
  type: Action;
  payload: Timestamp;
} => ({
  type: Action.SetSlotTime,
  payload: time,
});
// ***** End Region Date and Time ***** //
