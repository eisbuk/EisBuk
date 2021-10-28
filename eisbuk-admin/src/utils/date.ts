import { DateTime } from "luxon";

/**
 * A helper function checks if passed string is a valid ISO date string
 * in a day format (yyyy-mm-dd)
 *
 * _will return false even if a string is a valid ISO date, but doesn't conform to `yyyy-mm-dd`,
 * i.e. includes time of day, is just a month string, etc._
 * @param string to check for ISO validity
 * @returns boolean
 */
export const isISODay = (string?: string): boolean =>
  string ? string.length === 10 && DateTime.fromISO(string).isValid : false;
