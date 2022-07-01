import { LocalStore } from "@/types/store";

/** Get current notification (to be shown to the UI) from the store */
export const getActiveNotification = (state: LocalStore) =>
  state.notifications.queue[0];
