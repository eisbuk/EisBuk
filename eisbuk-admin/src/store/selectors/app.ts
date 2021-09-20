import { DateTime } from "luxon";

import { LocalStore, Notification } from "@/types/store";

// #region notifications
/**
 * Get notifications from store
 * @param state Local Redux State
 * @returns notification array
 */
export const getNotifications = (state: LocalStore): Notification[] =>
  state.app.notifications;
// #endregion notifications

// ***** Region Slot Time ***** //
/**
 * Get new slot time from local store
 * @param state Local Redux State
 * @returns Timestamp
 */
export const getNewSlotTime = (
  state: LocalStore
): LocalStore["app"]["newSlotTime"] => state.app.newSlotTime;
// ***** End Region Slot Time ***** //

// ***** Region Current Timeframe ***** //
/**
 * Used as umbrella type for all "current timeframe selectors"
 * All of the selectors take in local store state and
 * return start of current timeframe (day, week, etc.) in `DateTime` format
 */
interface CurrentTimeframeSelector {
  (state: LocalStore): DateTime;
}

/**
 * Get start time of current calendar day
 * @param state Local Redux State
 * @returns start time of current calendar day in `DateTime` format
 */
export const getCalendarDay: CurrentTimeframeSelector = (state) =>
  state.app.calendarDay;

/**
 * Get start time of current week
 * @param state Local Redux State
 * @returns start time of current week in `DateTime` format
 */
export const getCurrentWeekStart: CurrentTimeframeSelector = (state) =>
  state.app.calendarDay.startOf("week");
