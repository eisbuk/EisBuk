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
