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
 *
 * We rely on the firestore rules to enforce security: only users whose
 * email or phone number appears amongst the organization admins will be able
 * to get a valid response (and hence a populated array) from the organization.
 * For this reason we only check that the admins array is non-empty here.
 */
export const getAmIAdmin = (state: LocalStore): boolean =>
  state.authInfoEisbuk.admins.length > 0;
