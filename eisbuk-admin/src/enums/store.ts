/**
 * All redux actions are contained here
 */
export enum Action {
  EnqueueNotification = "@@Eisbuk/ENQUEUE_NOTIFICATION",
  RemoveNotification = "@@Eisbuk/REMOVE_NOTIFICATION",
  CloseSnackbar = "@@Eisbuk/CLOSE_SNACKBAR",

  ChangeDay = "@@Eisbuk/CHANGE_DAY",

  SetSlotTime = "@@Eisbuk/SET_SLOT_TIME",

  CopySlotDay = "@@Eisbuk/COPY_SLOT_DAY",
  CopySlotWeek = "@@Eisbuk/COPY_SLOT_WEEK",
  PasteSlotDay = "@@Eisbuk/PASTE_SLOT_DAY",
  PasteSlotWeek = "@@Eisbuk/PASTE_SLOT_WEEK",
  DeleteSlotFromClipboard = "@@Eisbuk/DELETE_SLOT_FROM_CLIPBOARD0",
  AddSlotToClipboard = "@@Eisbuk/ADD_SLOT_TO_CLIPBOARD",

  IsOrganizationStatusReceived = "@@Eisbuk/IS_getOrganization()_STATUS_RECEIVED",
}

/**
 * Notification variants (success/error)
 */
export enum NotifVariant {
  Success = "success",
  Error = "error",
}
