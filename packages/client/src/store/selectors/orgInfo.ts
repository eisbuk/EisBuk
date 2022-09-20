import { LocalStore } from "@/types/store";

export const getDefaultCountryCode = (state: LocalStore) =>
  (Object.values(state.firestore.data.publicOrgInfo || {})[0] || {})
    .defaultCountryCode || "";
