import { NotificationInterface } from "@/types/store";

import {
  NotificationReducerAction,
  NotificationAction,
} from "../reducers/notificationsReducer";

export const enqueueNotification = (
  notification: Omit<NotificationInterface, "key">
): NotificationReducerAction<NotificationAction.Enqueue> => ({
  type: NotificationAction.Enqueue,
  payload: notification,
});

export const nextNotification =
  (): NotificationReducerAction<NotificationAction.Next> => ({
    type: NotificationAction.Next,
  });

export const evictNotification =
  (): NotificationReducerAction<NotificationAction.Evict> => ({
    type: NotificationAction.Evict,
  });
