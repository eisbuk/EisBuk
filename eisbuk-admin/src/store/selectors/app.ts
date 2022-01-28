import { DateTime } from "luxon";

import { LocalStore, Notification } from "@/types/store";
import { getOrganization } from "@/lib/getters";
import { OrganizationData } from "eisbuk-shared/dist";

// #region notifications
/**
 * Get notifications from store
 * @param state Local Redux State
 * @returns notification array
 */
export const getNotifications = (state: LocalStore): Notification[] =>
  state.app.notifications;
// #endregion notifications

/**
 * Get start time of current calendar day
 * @param state Local Redux State
 * @returns start time of current calendar day in `DateTime` format
 */
export const getCalendarDay = (state: LocalStore): DateTime =>
  state.app.calendarDay;

/**
 * Get Organization
 * @param state Local Redux State
 * @returns Organization
 */
export const getOrganizationSettings = (state: LocalStore): OrganizationData =>
  state.firestore.data.organizations![getOrganization()];
