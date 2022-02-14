import { useState, useEffect } from "react";
import { DateTime } from "luxon";

type CountdownTuple = [string, string, string, string];

interface CountdownFunction {
  (countdownDate: DateTime): CountdownTuple;
}

/**
 * Counts down to provided `countdownDate`, ticks each second
 * and returns a `CountdownTuple`
 * @param {DateTime} countdownDate date we're counting down to
 * @returns {string[]} tuple of four two-character `string` representations of
 * countdown values in format: ["dd", "hh", "mm", "ss"]
 */
const useCountdown: CountdownFunction = (countdownDate) => {
  const [countdown, setCountdown] = useState<CountdownTuple>(
    getCountdownValues(countdownDate)
  );

  useEffect(() => {
    const hourInMillis = 1000;
    const interval = setTimeout(() => {
      setCountdown(getCountdownValues(countdownDate));
    }, hourInMillis);

    return () => clearTimeout(interval);
  }, [countdown, countdownDate]);

  return countdown;
};

/**
 * Calculates the time difference between `DateTime.now()` and
 * provided `countdownDate`, returns result in `CountdownTuple`
 *
 * Has the same interface (params, return type) as `useCountdown` hook
 */
const getCountdownValues: CountdownFunction = (countdownDate) => {
  const now = DateTime.fromMillis(Date.now());
  const {
    days: rawDays,
    hours: rawHours,
    minutes: rawMinutes,
    seconds: rawSeconds,
  } = countdownDate.diff(now, ["days", "hours", "minutes", "seconds"]);

  // turn the numbers into "01", "23", etc strings
  return [rawDays, rawHours, rawMinutes, rawSeconds].map((val) =>
    `0${Math.floor(val)}`.slice(-2)
  ) as CountdownTuple;
};

export default useCountdown;
