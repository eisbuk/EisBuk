import { DateTime } from "luxon";

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
    .map((day) =>
      day.sort((a, b) => {
        const luxonA = DateTime.fromISO(a);
        const luxonB = DateTime.fromISO(b);
        const diff = luxonA.diff(luxonB).milliseconds;
        return diff;
      })
    )
    // flatten the dates (get array of dates ordered, but not grouped by week day)
    .reduce((acc, weekDay) => [...acc, ...weekDay], [] as string[]);
