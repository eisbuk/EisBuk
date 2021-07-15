import firebase from "firebase/app";
import "firebase/firestore";
import { DateTime } from "luxon";
import { Timestamp as FbTimestamp } from "@google-cloud/firestore";

const Timestamp = firebase.firestore.Timestamp;

/**
 * Convert Firebase Timestamp to luxon string (DateTime)
 * @param fbDatetime
 * @returns
 */
export const FBToLuxon = (fbDatetime: FbTimestamp) => {
  return DateTime.fromJSDate(new Date(fbDatetime.seconds * 1000));
};

/**
 * Convert ISO Date string to luxon string (DateTime)
 * @param isoStr
 * @returns
 */
export const fromISO = (isoStr: string) => DateTime.fromISO(isoStr);

/**
 * Convert luxon string (DateTime) in to Firebase Timestamp
 * @param luxonTS
 * @returns
 */
export const luxonToFB = (luxonTS: DateTime) =>
  Timestamp.fromDate(luxonTS.toJSDate());
