import { NotifVariant } from "@/enums/store";

export enum NotificationAction {
  Enqueue = "@@NOTIFICATION/ENQUEUE",
  Next = "@@NOTIFICATION/NEXT",
  Evict = "@@NOTIFICATION/EVICT",
}

/**
 * A notification to be enqueued in the store and shown to the UI
 */
export interface NotificationInterface {
  /** A uuid string generated to identify the notification */
  key: string;
  /** Content */
  message: string;
  /** "success" / "error" */
  variant: NotifVariant;
  /** (Optional) error to be logged to the console */
  error?: Error;
}

/**
 * Notification porton of the store is in charge of enqueueing notifications and displaying them
 * in an orderly manner.
 */
export interface NotificationsState {
  /**
   * Queue houses all notifications showing or to be shown, where
   * the first one (queue[0]) is the one currently shown.
   */
  queue: NotificationInterface[];
  /**
   * This flag is `true` in special cases where there's only one notification in store,
   * but has been shown for long enough that it can be replaced with the new one.
   *
   * If `false`, any new notification being added will simply be enqueued at the end of the queue
   */
  canEvict: boolean;
}

export type NotificationReducerAction<A extends NotificationAction> =
  A extends NotificationAction.Enqueue
    ? {
        type: NotificationAction.Enqueue;
        payload: Omit<NotificationInterface, "key"> & { error?: Error };
      }
    : { type: A };
