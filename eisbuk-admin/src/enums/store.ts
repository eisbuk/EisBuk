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

  UpdateAuthInfo = "@@Eisbuk/UPDATE_AUTH_INFO",
  UpdateAdminStatus = "@@Eisbuk/UPDATE_ADMIN_STATUS",
  Logout = "@@Eisbuk/LOGOUT",

  UpdateFirestoreListener = "@@Eisbuk/UPDATE_FIRESTORE_LISTENER",
  UpdateLocalDocuments = "@@Eisbuk/UPDATE_LOCAL_DOCUMENTS",
  DeleteLocalDocuments = "@@Eisbuk/DELETE_LOCAL_DOCUMENTS",
  DeleteFirestoreListener = "@@Eisbuk/DELETE_FIRESTORE_LISTENER",
}
/**
 * Notification variants (success/error)
 */
export enum NotifVariant {
  Success = "success",
  Error = "error",
}
