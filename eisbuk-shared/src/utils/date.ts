import { DateTime } from "luxon";

/**
 * Convert ISO Date string to luxon string (DateTime)
 * @param isoStr
 * @returns
 */
export const fromISO = (isoStr: string): DateTime => DateTime.fromISO(isoStr);

/**
 * Converts the luxon DateTime to ISO date string format with only the day part (excluding time of day)
 * @param luxonDate to convert
 * @returns ISO `yyyy-mm-dd` string
 */
export const luxon2ISODate = (luxonDate: DateTime): string =>
  luxonDate.toISO().substr(0, 10);
