import { SlotInterface, SlotInterval } from "@eisbuk/shared";

/**
 * Calculates the `startTime` of earliset interval and the `endTime` of latest interval,
 * @param intervals a record of all intervals
 * @returns a string representation of slot's timespan: `${startTime} - ${endTime}`
 *
 * @DUPLICATE in @eisbuk/client/src/utils/helpers.ts
 */
export const getSlotTimespan = (
  intervals: SlotInterface["intervals"]
): string => {
  // calculate single { startTime, endTime } object
  const { startTime, endTime } = Object.values(intervals).reduce(
    (acc, interval) => {
      const startTime =
        !acc.startTime || acc.startTime > interval.startTime
          ? interval.startTime
          : acc.startTime;
      const endTime =
        !acc.endTime || acc.endTime < interval.endTime
          ? interval.endTime
          : acc.endTime;

      return { startTime, endTime };
    },
    {} as SlotInterval
  );
  // return time string
  return `${startTime} - ${endTime}`;
};

/**
 * `Array.protorype.sort()` callback function:
 *
 * @param {string} first The first time period
 * @param {string} second The second time period
 * @returns number
 * Compares two period strings like "13:30-14:00" and "13:15-14:15"
 * Returns -1 if the first period is earlier than the second; if
 * they're equal it returns -1 if the first period is longer than the second one
 * i.e. if its finishing time is later.
 *
 * @DUPICATE in @eisbuk/client/src/utils/sort.ts
 */
export const comparePeriods = (first: string, second: string): number => {
  const [firstStart, firstEnd] = first.split("-");
  const [secondStart, secondEnd] = second.split("-");

  switch (true) {
    case first === second:
      return 0;

    case firstStart < secondStart:
      return -1;

    case firstStart > secondStart:
      return 1;

    default:
      return firstEnd > secondEnd ? -1 : 1;
  }
};
