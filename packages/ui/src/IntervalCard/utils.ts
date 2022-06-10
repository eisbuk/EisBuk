import { IntervalDuration } from "./IntervalCard";

const hourInMillis = 3600000;

/**
 * Calculate milliseconds passed from start of day (for ISO time string, eg. "09:00")
 */
const getMillisFromMidnight = (time: string) =>
  time
    .split(":")
    .reduce((acc, curr, i) => acc + parseInt(curr) * 1000 * 60 ** (2 - i), 0);

/**
 * Calculates duration from provided start/end time (ISO string) input
 */
export const calculateDuration = (startTime: string, endTime: string) => {
  const diffMillis =
    getMillisFromMidnight(endTime) - getMillisFromMidnight(startTime);

  return diffMillis <= hourInMillis
    ? IntervalDuration["1h"]
    : diffMillis <= hourInMillis * 1.5
    ? IntervalDuration["1.5h"]
    : IntervalDuration["2h"];
};
