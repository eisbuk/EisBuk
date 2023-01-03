import { User } from "@firebase/auth";

import { LocalStore } from "@/types/store";

/**
 * Get local user auth object
 * @param state Local Redux Store
 * @returns {User} auth data
 */
export const getLocalAuth = (state: LocalStore): User | null =>
  state.auth.userData;

/**
 * Get email from local store auth: this can be used to prefill email in self register form
 */
export const getAuthEmail = (state: LocalStore) =>
  state.auth.userData?.email || undefined;
/**
 * Get phone number from local store auth: this can be used to prefill phone number in self register form
 */
export const getAuthPhoneNumber = (state: LocalStore) =>
  state.auth.userData?.phoneNumber || undefined;

/**
 * Get boolean representing if a curren user is an authenticated
 * with our firebase auth record
 *
 * **Not to be confused with is admin as this only means that the user is authenticated with (at least) one of
 * our organizations, not necessarily the current organization**
 *
 * @param state Local Redux Store
 * @returns true is current user is admin (boolean)
 */
export const getIsAuthEmpty = (state: LocalStore): boolean =>
  state.auth.isEmpty;

/**
 * Get boolean representing if currently logged in user is administrator
 * @param state Local Redux Store
 * @returns true is current user is admin (boolean)
 */
export const getIsAdmin = (state: LocalStore): boolean => state.auth.isAdmin;

/**
 * Get secretKey for customer's bookings from store (if any)
 * @param state Local Redux Store
 * @returns secretKey if it exists, undefined if it doesn't
 */
export const getBookingsSecretKey = (state: LocalStore): string | undefined =>
  state.auth.bookingsSecretKey;

/**
 * Get boolean representing auth load state (set to true when initial auth is loaded)
 * @param state Local Redux Store
 * @returns true is current user is admin (boolean)
 */
export const getIsAuthLoaded = (state: LocalStore): boolean =>
  state.auth.isLoaded;
