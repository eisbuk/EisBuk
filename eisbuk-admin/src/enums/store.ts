/**
 * All redux actions are contained here
 */
export enum Action {
  EnqueueNotification = "@@Eisbuk/ENQUEUE_NOTIFICATION",
  RemoveNotification = "@@Eisbuk/REMOVE_NOTIFICATION",
  CloseSnackbar = "@@Eisbuk/CLOSE_SNACKBAR",

  ChangeDay = "@@Eisbuk/CHANGE_DAY",

  CopySlotDay = "@@Eisbuk/COPY_SLOT_DAY",
  CopySlotWeek = "@@Eisbuk/COPY_SLOT_WEEK",
  DeleteSlotFromClipboard = "@@Eisbuk/DELETE_SLOT_FROM_CLIPBOARD0",
  AddSlotToClipboard = "@@Eisbuk/ADD_SLOT_TO_CLIPBOARD",

  SetSlotTime = "@@Eisbuk/SET_SLOT_TIME",

  IsAdminReceived = "@@Eisbuk/IS_ADMIN_RECEIVED",
}

/**
 * Notification variants (success/error)
 */
export enum NotifVariant {
  Success = "success",
  Error = "error",
}
