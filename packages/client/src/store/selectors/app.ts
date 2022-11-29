import { DateTime } from "luxon";

import { LocalStore } from "@/types/store";
import { OrganizationData } from "@eisbuk/shared/dist";

/**
 * Get start time of current calendar day
 * @param state Local Redux State
 * @returns start time of current calendar day in `DateTime` format
 */
export const getCalendarDay = (state: LocalStore): DateTime =>
  state.app.calendarDay;

export const getOrganizationSettings = (
  state: LocalStore
): Partial<OrganizationData> => {
  if (Object.values(state.firestore.data.organizations || {}).length > 1) {
    console.error("More than one organization are in store");
  }

  return Object.values(state.firestore.data.organizations || {})[0] || {};
};

export const getAboutOrganization = (
  state: LocalStore
): Pick<OrganizationData, "displayName" | "location" | "emailFrom"> =>
  state.firestore.data.publicOrgInfo || {};

export const getSecretKey = (state: LocalStore) => state.app.secretKey;
