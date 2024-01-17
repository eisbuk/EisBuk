import { SlotInterface, SlotInterval } from "@/types/firestore";

/**
 * Calculates the `startTime` of earliset interval and the `endTime` of latest interval,
 * @param intervals a record of all intervals
 * @returns a string representation of slot's timespan: `${startTime} - ${endTime}`
 *
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

// #region CalculateInterval
export const calculateIntervalDurationInMinutes = (interval: string | null) => {
  if (interval === null) {
    return 0;
  }

  const [startTime, endTime] = interval.split("-");
  const minuteInMillis = 60000;

  return (
    (getMillisFromMidnight(endTime) - getMillisFromMidnight(startTime)) /
    minuteInMillis
  );
};

/**
 * @param {string | null} interval - String slot interval in blocks of half hours
 * Converts a string slot interval to a number e.g:
 * `null => 0`;
 * `"21:00 - 21:20" => 0.5`;
 * `"16:00 - 17:00" => 1.0`;
 * `"22:00 - 23:30" => 1.5`;
 * `"22:00 - 24:00" => 2`;
 * `"22:20 - 24:00" => 2`;
 */

export const calculateIntervalDuration = (interval: string | null) => {
  const timeInHours = calculateIntervalDurationInMinutes(interval) / 60;

  return Math.ceil(timeInHours * 2) * 0.5;
};

/**
 * Calculate milliseconds passed from start of day (for ISO time string, eg. "09:00")
 */
export const getMillisFromMidnight = (time: string) =>
  time
    .split(":")
    .reduce((acc, curr, i) => acc + parseInt(curr) * 1000 * 60 ** (2 - i), 0);

// #endregion CalculateInterval
