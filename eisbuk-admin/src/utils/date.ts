import { DateTime } from "luxon";
import { Timestamp as FbTimestamp } from "@google-cloud/firestore";

import firebase from "firebase/app";

/** @TODO This is a temp fix since the tests accept one type and all other evnironments accept the other...this needs to be fixed with the Timestamp issue ticket */
const Timestamp =
  process.env.NODE_ENV === "test" ? FbTimestamp : firebase.firestore.Timestamp;

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
export const luxonToFB = (date: DateTime): FbTimestamp => {
  // since DateTime uses system timezone, and Timestamp is an absolute time since the UNIX epoch
  // here we're adding the offset to the `date` to simulate the same time in UTC (not to confuse the server aggregating slots by date)
  const cleanDate = date.plus({ minutes: date.offset });
  return Timestamp.fromMillis(cleanDate.toMillis());
};

/**
 * Converts the luxon DateTime to ISO date string format with only the day part (excluding time of day)
 * @param luxonDate to convert
 * @returns ISO `yyyy-mm-dd` string
 */
export const luxon2ISODate = (luxonDate: DateTime): string =>
  luxonDate.toISO().substr(0, 10);
