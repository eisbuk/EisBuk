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
 * Get boolean representing auth load state (set to true when initial auth is loaded)
 * @param state Local Redux Store
 * @returns true is current user is admin (boolean)
 */
export const getIsAuthLoaded = (state: LocalStore): boolean =>
  state.auth.isLoaded;