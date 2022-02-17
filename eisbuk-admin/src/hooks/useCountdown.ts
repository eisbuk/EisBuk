import { useState, useEffect, useRef } from "react";
import { DateTime } from "luxon";

type CountdownTuple = [string, string, string, string];

interface CountdownFunction {
  (countdownDate: DateTime | null): CountdownTuple | null;
}

/**
 * Counts down to provided `countdownDate`, ticks each second
 * and returns a `CountdownTuple`
 * @param {DateTime} countdownDate date we're counting down to
 * @returns {string[]} tuple of four two-character `string` representations of
 * countdown values in format: ["dd", "hh", "mm", "ss"]
 */
const useCountdown: CountdownFunction = (countdownDate) => {
  const [countdown, setCountdown] = useState<CountdownTuple | null>(
    getCountdownValues(countdownDate)
  );

  // store timeout in a ref to be accessible from multiple functions
  const timeout = useRef<NodeJS.Timeout | null>(null);

  // clear timeout and reset it to `null`
  const resetTimeout = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
  };

  // control 'tick' each second using setTimeout
  useEffect(() => {
    const hourInMillis = 1000;
    timeout.current = setTimeout(() => {
      setCountdown(getCountdownValues(countdownDate));
    }, hourInMillis);

    return resetTimeout;
  }, [countdown]);

  // update the countdown with updated prop for `countdownDate`
  // reseting timeout in the process
  useEffect(() => {
    resetTimeout();
    setCountdown(getCountdownValues(countdownDate));
  }, [countdownDate]);

  return countdown;
};

/**
 * Calculates the time difference between `DateTime.now()` and
 * provided `countdownDate`, returns result in `CountdownTuple`
 *
 * Has the same interface (params, return type) as `useCountdown` hook
 */
const getCountdownValues: CountdownFunction = (countdownDate) => {
  if (!countdownDate) return null;

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
