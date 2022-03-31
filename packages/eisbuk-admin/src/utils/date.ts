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

/**
 * @param d1
 * @param d2
 * @returns rounded down (monthly) difference between two months (d1 - d2)
 */
export const getMonthDiff = (d1: DateTime, d2: DateTime): number => {
  // correct dates to start of their respective months
  const cd1 = d1.startOf("month");
  const cd2 = d2.startOf("month");

  return Math.floor(cd1.diff(cd2.startOf("month"), "months").months);
};