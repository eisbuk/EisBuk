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

/**
 * Get boolean representing if currently logged in user is administrator
 * @param state Local Redux Store
 * @returns true is current user is admin (boolean)
 */
export const getAmIAdmin = (state: LocalStore): boolean =>
  state.authInfoEisbuk.admins.includes(state.firebase.auth.email || "*") ||
  state.authInfoEisbuk.admins.includes(state.firebase.auth.phoneNumber || "*");
