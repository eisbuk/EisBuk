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

const intervalRegex = /^\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*$/;

/**
 * Parses a time of day ("HH:mm", "24:00" allowed as end of day) into minutes from midnight.
 * Returns `null` if the values are out of range.
 */
const parseMinutesOfDay = (hours: string, minutes: string): number | null => {
  const h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  if (h > 24 || m > 59 || (h === 24 && m !== 0)) return null;
  return h * 60 + m;
};

/**
 * Validated duration, in whole minutes, of a string interval (e.g. `"16:10-17:00" => 50`).
 *
 * Unlike `calculateIntervalDurationInMinutes`, this doesn't round anything and returns `null`
 * for a missing or malformed interval (not two "HH:mm" times, or end not after start),
 * so that callers summing durations can exclude such entries explicitly instead of adding `NaN` or a negative number.
 *
 * Intervals are wall-clock times on the lesson's date, so the duration is the difference between the two times
 * (this differs from the physically elapsed time only for an interval spanning a daylight saving change, at night).
 *
 * Sum the minutes and convert to hours only when displaying the total.
 */
export const getIntervalMinutes = (
  interval: string | null | undefined
): number | null => {
  if (typeof interval !== "string") return null;

  const match = intervalRegex.exec(interval);
  if (!match) return null;

  const start = parseMinutesOfDay(match[1], match[2]);
  const end = parseMinutesOfDay(match[3], match[4]);
  if (start === null || end === null || end <= start) return null;

  return end - start;
};

// #endregion CalculateInterval
