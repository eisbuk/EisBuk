import { getOrganization } from "@/lib/getters";
import { LocalStore } from "@/types/store";

const getPublicOrgInfo = (state: LocalStore) =>
  state.firestore.data.publicOrgInfo
    ? state.firestore.data.publicOrgInfo[getOrganization()]
    : undefined;

export const getOrgEmail = (state: LocalStore) =>
  getPublicOrgInfo(state)?.emailFrom;

export const getDefaultCountryCode = (state: LocalStore) =>
  getPublicOrgInfo(state)?.defaultCountryCode;
