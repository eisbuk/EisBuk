import { NotifVariant } from "@/enums/store";
import { Reducer } from "redux";
import { v4 as uuid } from "uuid";

export interface NotificationInterface {
  key: string;
  message: string;
  variant: NotifVariant;
}

export interface NotificationsState {
  queue: NotificationInterface[];
  canEvict: boolean;
}

export enum NotificationAction {
  Enqueue = "@@NOTIFICATION/ENQUEUE",
  Next = "@@NOTIFICATION/NEXT",
  Evict = "@@NOTIFICATION/EVICT",
}

export type NotificationReducerAction<A extends NotificationAction> =
  A extends NotificationAction.Enqueue
    ? {
        type: NotificationAction.Enqueue;
        payload: Omit<NotificationInterface, "key">;
      }
    : { type: A };

const initialState: NotificationsState = {
  queue: [],
  canEvict: true,
};

const notificationsReducer: Reducer<
  NotificationsState,
  NotificationReducerAction<NotificationAction>
> = (state = initialState, action) => {
  switch (action.type) {
    case NotificationAction.Enqueue:
      const newNotification = { ...action.payload, key: uuid() };
      return {
        ...state,
        queue: state.canEvict
          ? [newNotification]
          : [...state.queue, newNotification],
        canEvict: false,
      };

    case NotificationAction.Next:
      if (state.queue.length > 1) {
        return { ...state, queue: state.queue.slice(1) };
      }
      return { ...state, canEvict: true };

    case NotificationAction.Evict:
      return { canEvict: false, queue: state.queue.slice(1) };

    default:
      return state;
  }
};

export default notificationsReducer;
