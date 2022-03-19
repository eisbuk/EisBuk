import { EmailMessage, SMSMessage } from "./firestore";

export interface SendMailPayload extends EmailMessage {
  organization: string;
  subject: string;
}

export interface SendSMSPayload extends SMSMessage {
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
  bookingsSecretKey?: string;
}
