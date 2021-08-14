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
export const fb2Luxon = (fbDatetime?: FbTimestamp): DateTime =>
  DateTime.fromJSDate(
    new Date(fbDatetime ? fbDatetime.seconds * 1000 : Date.now())
  );

/**
 * Convert ISO Date string to luxon string (DateTime)
 * @param isoStr
 * @returns
 */
export const fromISO = (isoStr: string): DateTime => DateTime.fromISO(isoStr);

/**
 * Convert luxon string (DateTime) in to Firebase Timestamp
 * @param luxonTS
 * @returns
 */
export const luxonToFB = (luxonTS: DateTime): FbTimestamp =>
  Timestamp.fromDate(luxonTS.toJSDate());

/**
 * Converts the luxon DateTime to ISO date string format with only the day part (excluding time of day)
 * @param luxonDate to convert
 * @returns ISO `yyyy-mm-dd` string
 */
export const luxon2ISODate = (luxonDate: DateTime): string =>
  luxonDate.toISO().substr(0, 10);
