import { NotifVariant } from "@/enums/store";
import { Reducer } from "redux";

export interface NotificationInterface {
  key: string;
  message: string;
  variant: NotifVariant;
}

export interface NotificationsState {
  queue: NotificationInterface[];
}

enum NotificationAction {
  Enqueue = "@@NOTIFICATION/ENQUEUE",
  Next = "@@NOTIFICATION/NEXT",
  Evict = "@@NOTIFICATION/EVICT",
}

type NotificationReducerAction<A extends NotificationAction> =
  A extends NotificationAction.Enqueue
    ? {
        type: NotificationAction.Enqueue;
        payload: Omit<NotificationInterface, "key">;
      }
    : { type: A };

const initialState: NotificationsState = {
  queue: [],
};

const notificationsReducer: Reducer<
  NotificationsState,
  NotificationReducerAction<NotificationAction>
> = (state = initialState) => {
  return state;
};

export default notificationsReducer;
