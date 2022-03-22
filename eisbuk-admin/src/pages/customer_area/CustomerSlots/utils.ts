import { DateTime } from "luxon";

/**
 * Creates a sort function callback used to compare two ISO dates
 * and return 1 or -1 as per the spec of `Array.protorype.sort()`
 * callback.
 * @param {"asc" | "dsc"} direction sort ascending or descending
 */
const compareISO = (direction: "asc" | "desc") => (a: string, b: string) => {
  const ascRes = a < b ? -1 : 1;
  return direction === "asc" ? ascRes : ascRes * -1;
};

/**
 * Takes an array of dates, groups them by week day,
 * sorts week days internally (in chronological order)
 * @param dates unsorted array of ISO dates
 * @returns array of dates (ISO) sorted by week day
 */
export const orderByWeekDay = (dates: string[]): string[] =>
  dates
    // group dates by day of the week
    .reduce((acc, date) => {
      const luxonDay = DateTime.fromISO(date);
      // `.weekDay` returns 1 for monday and we want to start with 0
      const dayOfWeek = luxonDay.weekday - 1;
      acc[dayOfWeek] = [...(acc[dayOfWeek] || []), date];
      return acc;
    }, [] as string[][])
    // sort week days internally
    .map((day) => day.sort(compareISO("asc")))
    // flatten the dates (get array of dates ordered, but not grouped by week day)
    .reduce((acc, weekDay) => [...acc, ...weekDay], [] as string[]);

/**
 * Takes an array of dates, sort them by date
 * @param dates unsorted array of ISO dates
 * @returns sorted array of dates (ISO)
 */
export const orderByDate = (dates: string[]): string[] =>
  [...dates].sort(compareISO("asc"));
