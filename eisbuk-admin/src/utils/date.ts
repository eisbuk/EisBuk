import { DateTime } from "luxon";

import { Timestamp } from "firebase/firestore";

/**
 * Convert Firebase Timestamp to luxon string (DateTime)
 * @param fbDatetime
 * @returns
 */
export const fb2Luxon = (fbDatetime?: Timestamp): DateTime =>
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
export const luxonToFB = (date: DateTime): Timestamp => {
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
