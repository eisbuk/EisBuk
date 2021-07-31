import { LocalStore, Notification } from "@/types/store";

/**
 * Get notifications from store
 * @param state Local Redux State
 * @returns notification array
 */
export const getNotifications = (state: LocalStore): Notification[] =>
  state.app.notifications;

/**
 * Get new slot time from local store
 * @param state Local Redux State
 * @returns Timestamp
 */
export const getNewSlotTime = (
  state: LocalStore
): LocalStore["app"]["newSlotTime"] => state.app.newSlotTime;
