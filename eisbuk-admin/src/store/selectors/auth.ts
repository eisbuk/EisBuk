import { LocalStore } from "@/types/store";

/**
 * Get auth object from firebase part of the local store
 * @param state Local Redux Store
 * @returns auth object
 */
export const getFirebaseAuth = (
  state: LocalStore
): LocalStore["firebase"]["auth"] => state.firebase.auth;

/**
 * Get local auth object
 * @param state Local Redux Store
 * @returns local auth object (authInfoEisbuk)
 */
export const getLocalAuth = (state: LocalStore): LocalStore["authInfoEisbuk"] =>
  state.authInfoEisbuk;
