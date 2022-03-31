import { useEffect, useState } from "react";

interface DebounceHook {
  <F extends (...params: any[]) => void>(fn: F, delay?: number): F;
}

/**
 * A simple hook used to debounce execution of the function. Receives callback function and delay.
 * And returns "debounced" function: accepting the same params as callback function and triggering
 * execution with timeout.
 * @param fn callback function (gets called with the last value for params in the series of calls)
 * @param delay debounce timeout
 * @returns debounced function (used to trigger execution)
 */
const useDebounce: DebounceHook = (fn, delay) => {
  const [values, setValues] = useState<Parameters<typeof fn> | null>(null);

  useEffect(() => {
    if (values) {
      const timeout = setTimeout(() => {
        fn(...values);
      }, delay);
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
    return () => {};
  }, [values]);

  const debouncedFunc = (...params: Parameters<typeof fn>) => {
    setValues(params);
  };

  return debouncedFunc as typeof fn;
};

export default useDebounce;
