import {
  NotificationInterface,
  NotificationReducerAction,
  NotificationAction,
} from "../reducers/notificationsReducer";

export const enqueueNotification = (
  notification: Omit<NotificationInterface, "key">
): NotificationReducerAction<NotificationAction.Enqueue> => ({
  type: NotificationAction.Enqueue,
  payload: notification,
});
