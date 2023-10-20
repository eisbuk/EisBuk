import { LocalStore } from "@/types/store";

import { getOrganization } from "@/lib/getters";

const getPublicOrgInfo = (state: LocalStore) =>
  state.firestore.data.publicOrgInfo
    ? state.firestore.data.publicOrgInfo[getOrganization()]
    : undefined;

export const getOrgDisplayName = (state: LocalStore) =>
  getPublicOrgInfo(state)?.displayName;

export const getOrgEmail = (state: LocalStore) =>
  getPublicOrgInfo(state)?.emailFrom;

export const getDefaultCountryCode = (state: LocalStore) =>
  getPublicOrgInfo(state)?.defaultCountryCode;

export const getPrivacyPolicy = (state: LocalStore) =>
  getPublicOrgInfo(state)?.privacyPolicy;
