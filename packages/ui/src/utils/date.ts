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
 * A helper function that parses ISO string and returns a string in european date format
 * (`dd/mm/yyyy`)
 *
 * _if passed `input` is not a valid ISO string, it returns the `input` as is_
 * @param input ISO string to convert
 * @returns string
 */
export const isoToDate = (input: string): string => {
  const [year, month, day] = input.split("-");
  return isISODay(input) ? `${day}/${month}/${year}` : input;
};

/**
 * A helper function that parses a valid european date separated by one of (. , / , -)
 * into an ISOString
 *
 * _if passed `input` is not a valid ISO string, it returns the `input` as is_
 * @param input user date input
 * @returns string
 */
export const dateToISO = (input: string): string => {
  const [day, month, year] = input.split(/[-/.]/).map(twoDigits);
  const isoString = `${year}-${month}-${day}`;
  return isISODay(isoString) ? isoString : input;
};

const twoDigits = (value: string) =>
  Number(value).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });

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
