import { v4 as uuid } from "uuid";

import { ReducerFactory } from "@/types/store";

import {
  NotificationsState,
  NotificationReducerAction,
  NotificationAction,
} from "./types";

const defaultState: NotificationsState = {
  queue: [],
  canEvict: true,
};

/**
 * A factory function returning a redux reducer for `notifications` state.
 * It is created using a factory rather than just creating the reducer as a variable
 * to enable us to pass `initialState`
 *
 * @param initialState (optional) state to be used as initial (fallback) state to the reducer. If not provided,
 * falls back to a locally defined `defaultState`.
 */
export const createNotificationsReducer: ReducerFactory<
  NotificationsState,
  NotificationReducerAction<NotificationAction>
> =
  (initialState) =>
  (state = { ...defaultState, ...initialState }, action) => {
    switch (action.type) {
      // Enqueue action adds new notification to the queue. Normally it will be added at the end of the queue.
      // If 'canEvict' is true, however, the existing notification (queue[0]) will be replaced with the new notification,
      // showing the new notification immediately.
      //
      // _Note that `canEvict` can be true only if the queue is empty or houses only one notification._
      case NotificationAction.Enqueue:
        const newNotification = { ...action.payload, key: uuid() };
        return {
          ...state,
          queue: state.canEvict
            ? [newNotification]
            : [...state.queue, newNotification],
          canEvict: false,
        };

      // Next action looks for the next notification to show, and shows it, if any exist
      //
      // However, it won't evict the only notification in the queue if that is the case (queue.length == 1)
      //
      // _Note that calling Next action signalizes that the current notification (even if not evicted, if only one in the queue), can be evicted
      // when new notification arrives (on Enqueue action), therefore, 'canEvict' is set to true_
      case NotificationAction.Next:
        if (state.queue.length > 1) {
          return { ...state, queue: state.queue.slice(1) };
        }
        return { ...state, canEvict: true };

      // Evict action evicts the notification from the start, regardless of additional notification existing in the queue or not
      //
      // _Note that evicting a notification brings up the next one in the queue (if such exists) and sets 'canEvict' to false,
      // until specified oterwise (by a subsequent call to Next action)_
      case NotificationAction.Evict:
        return { canEvict: false, queue: state.queue.slice(1) };

      default:
        return state;
    }
  };
