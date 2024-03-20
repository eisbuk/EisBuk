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
  (
    countdownDate: DateTime | null,
    systemDate: DateTime,
    tick?: TickLength
  ): CountdownStruct | null;
}

interface CountdownHelper {
  (
    countdownDate: DateTime | null,
    systemDate: DateTime
  ): CountdownStruct | null;
}

/**
 * Counts down to provided `countdownDate`, ticks each second
 * and returns a `CountdownTuple`
 * @param {DateTime} countdownDate date we're counting down to
 * @returns an object of values (number) until the deadline {days, hours, minutes, seconds}
 * or `null` if no `countdownDate` provided
 */
const useCountdown: HookInterface = (
  countdownDate,
  systemDate,
  tick = "second"
) => {
  const [countdown, setCountdown] = useState<CountdownStruct | null>(
    getCountdownValues(countdownDate, systemDate)
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
      setCountdown(getCountdownValues(countdownDate, systemDate));
    }, tickLength);

    return resetTimeout;
  }, [countdown]);

  // update the countdown with updated prop for `countdownDate`
  // reseting timeout in the process
  useEffect(() => {
    resetTimeout();
    setCountdown(getCountdownValues(countdownDate, systemDate));
  }, [countdownDate]);

  return countdown;
};

/**
 * Calculates the time difference between `DateTime.now()` and
 * provided `countdownDate`, returns result in `CountdownStruct`
 */
const getCountdownValues: CountdownHelper = (countdownDate, systemDate) => {
  if (!countdownDate) return null;

  const {
    seconds: secondsFloat,
    days,
    hours,
    minutes,
  } = countdownDate.diff(systemDate, ["days", "hours", "minutes", "seconds"]);

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
