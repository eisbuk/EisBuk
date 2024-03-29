import { EmailPayload, SMSMessage } from "./firestore";

export interface SendMailPayload extends EmailPayload {
  organization: string;
  secretKey?: string;
}

export interface SendSMSPayload extends SMSMessage {
  organization: string;
}

/**
 * Payload passed to `createUser` cloud function (for testing)
 */
export type CreateAuthUserPayload = Partial<{
  email: string;
  phoneNumber: string;
  password: string;
  organization: string;
  isAdmin: boolean;
}>;

// #region queryAuthStatus
/**
 * Payload of `queryAuthStatus` cloud function
 */
export interface QueryAuthStatusPayload {
  /** Current organization */
  organization: string;
}

/**
 * Auth status of an authenticated user. Returned by
 * `queryAuthStatus` cloud function and stored to `auth`
 * state of redux on client app
 */
export interface AuthStatus {
  /**
   * Is user admin of current organization
   */
  isAdmin: boolean;
  /**
   * If user is not admin of current organization,
   * but is a registered customer, this is their
   * secret key used to access bookings.
   * `undefined` if user is not a customer of an organization
   */
  secretKeys?: string[];
}

/**
 * @deprecated `AuthStatus` is used everywhere in the up-to-date code.
 * @TODO Remove this once the deprecated function is removed.
 */
export interface DeprecatedAuthStatus {
  isAdmin: boolean;
  bookingsSecretKey?: string;
}
// #endregion queryAuthStatus
