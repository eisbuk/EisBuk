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

  IsOrganizationStatusReceived = "@@Eisbuk/IS_ORGANIZATION_STATUS_RECEIVED",

  UpdateFirestoreListener = "@@Eisbuk/UPDATE_FIRESTORE_LISTENER",
  UpdateLocalCollection = "@@Eisbuk/UPDATE_LOCAL_COLLECTION",
  DeleteFirestoreListener = "@@Eisbuk/DELETE_FIRESTORE_LISTENER",
}
/**
 * Notification variants (success/error)
 */
export enum NotifVariant {
  Success = "success",
  Error = "error",
}
