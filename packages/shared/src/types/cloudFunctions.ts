import { Customer, EmailPayload, SMSMessage } from "./firestore";

export interface SendMailPayload extends EmailPayload {
  organization: string;
  secretKey?: Customer["secretKey"];
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
  /** String used to authenticate user, either email or phone */
  authString: string;
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
  bookingsSecretKey?: string;
}
// #endregion queryAuthStatus
