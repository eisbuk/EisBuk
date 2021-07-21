import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/lib/providers/https";
import admin from "firebase-admin";
import { Timestamp } from "@google-cloud/firestore";
import { DateTime } from "luxon";

type Auth = CallableContext["auth"];

/**
 * Round the given val to the nearest multiple of modbase
 * ```
 * roundTo(12, 5) === 10
 * roundTo(12, 4) === 12
 * roundTo(12, 7) === 7
 * roundTo(17, 4) === 16
 * ```
 * @param val
 * @param modbase
 * @returns
 */
export const roundTo = (val: number, modbase: number): number =>
  Math.floor(val / modbase) * modbase;

/**
 * Receives an organization name and an auth info object as
 * provided by the Firebase SDK. Raises an unauthorized exception
 * if the user is not authorized to manage the given organization
 * @param organization
 * @param auth
 */
export const checkUser = async (
  organization: string,
  auth: Auth
): Promise<void | never> => {
  if (auth && auth.token && (auth.token.email || auth.token.phone_number)) {
    const org = await admin
      .firestore()
      .collection("organizations")
      .doc(organization)
      .get();
    if (!isOrgAdmin(org.data()?.admins, auth)) {
      throwUnauth();
    }
  } else {
    throwUnauth();
  }
};

/**
 * Checks if provided organization has admin and
 * if user in fact is admin of said organization
 * @param admins array of admin credentials (email or name)
 * @param auth auth object of user we're checking out
 * @returns
 */
const isOrgAdmin = (admins: string[] | undefined, auth: Auth): boolean => {
  // fail early
  // if no admins are registered for the organization
  // or no auth is present
  if (!Array.isArray(admins) || !auth?.token) return false;

  const { email, phone_number: phoneNumber } = auth.token;

  return (email && admins.includes(email)) ||
    (phoneNumber && admins.includes(phoneNumber))
    ? true
    : false;
};

/**
 * Throws unauthorized https error
 */
const throwUnauth = (): never => {
  throw new functions.https.HttpsError(
    "permission-denied",
    "unauthorized",
    "The function must be called while authenticated with a user that is an admin of the given organization."
  );
};
/**
 * Convert a firestore date to a luxon date
 * currently ignores microseconds since seconds are already
 * more than enough for our use case
 * @param fsdate date object in firebase form
 */
export const fs2luxon = (fsdate: Timestamp): DateTime => {
  /** @TODO check fs date interface */
  return DateTime.fromMillis(fsdate.seconds * 1000);
};
