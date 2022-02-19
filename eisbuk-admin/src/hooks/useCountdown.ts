import { useState, useEffect, useRef } from "react";
import { DateTime } from "luxon";

type CountdownStruct = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type TickLength = "hour" | "minute" | "second";

interface HookInterface {
  (countdownDate: DateTime | null, tick?: TickLength): CountdownStruct | null;
}

interface CountdownHelper {
  (countdownDate: DateTime | null): CountdownStruct | null;
}

/**
 * Counts down to provided `countdownDate`, ticks each second
 * and returns a `CountdownTuple`
 * @param {DateTime} countdownDate date we're counting down to
 * @returns {string[]} tuple of four two-character `string` representations of
 * countdown values in format: ["dd", "hh", "mm", "ss"]
 */
const useCountdown: HookInterface = (countdownDate, tick = "second") => {
  const [countdown, setCountdown] = useState<CountdownStruct | null>(
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
    const tickLength = getTickLength(tick);
    timeout.current = setTimeout(() => {
      setCountdown(getCountdownValues(countdownDate));
    }, tickLength);

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
const getCountdownValues: CountdownHelper = (countdownDate) => {
  if (!countdownDate) return null;

  const now = DateTime.fromMillis(Date.now());
  const {
    seconds: secondsFloat,
    days,
    hours,
    minutes,
  } = countdownDate.diff(now, ["days", "hours", "minutes", "seconds"]);

  return {
    days,
    hours,
    minutes,
    seconds: Math.floor(secondsFloat),
  };
};

/**
 * @param tick "hour" | "minute" | "second"
 * @returns tick length in millis
 */
const getTickLength = (tick: TickLength): number => {
  const tickLengthLookup = {};
  tickLengthLookup["second"] = 1000;
  tickLengthLookup["minute"] = tickLengthLookup["second"] * 60;
  tickLengthLookup["hour"] = tickLengthLookup["minute"] * 60;

  return tickLengthLookup[tick];
};

export default useCountdown;
