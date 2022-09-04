import { LocalStore } from "@/types/store";

export const getCountryCode = (state: LocalStore) =>
  Object.values(state.firestore.data.publicOrgInfo || {})[0].countryCode || "";
