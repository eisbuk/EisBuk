import { SlotInterval } from "@/types/firestore";

/**
 * Processes an interval string to ensure the returned string is in format displayed by the UI
 * (and can be used for matching in the UI).
 *
 * @example
 * ```ts
 * // Using misformatted string
 * getDisplayInterval("10:00-  11:00") // "10:00 - 11:00"
 * getDisplayInterval("10:00-11:00") // "10:00 - 11:00"
 * getDisplayInterval("10:00 - 11:00") // "10:00 - 11:00" (ID)
 *
 * // Using interval object
 * getDisplayInterval({ startTime: "10:00", endTime: "11:00" }) // "10:00 - 11:00"
 * ```
 */
export function getIntervalString(
  interval: string | { startTime: string; endTime: string }
) {
  return typeof interval === "string"
    ? interval.replace(/ /g, "").replace("-", " - ")
    : `${interval.startTime} - ${interval.endTime}`;
}

/**
 * To be used as a callback to an `Array.protorype.sort` function.
 *
 * Sorts slot interval strings so that the intervals with highest duration come first.
 * Intervals with the same duration are sorted chronologically.
 * @TODO_SORT
 */
export function compareIntervals(a: string, b: string): number;
export function compareIntervals(a: SlotInterval, b: SlotInterval): number;
export function compareIntervals(
  _a: string | SlotInterval,
  _b: string | SlotInterval
) {
  const a = typeof _a === "string" ? _a : getIntervalString(_a);
  const b = typeof _b === "string" ? _b : getIntervalString(_b);

  const getDurationMinutes = (intervalStr: string) =>
    intervalStr
      // Split start and end time
      .split("-")
      .reduce(
        // Calculate difference (in minutes) of end time - start time
        (acc, curr) =>
          curr
            .split(":")
            .reduce(
              (acc, curr, i) => acc + (i ? Number(curr) : Number(curr) * 60),
              0
            ) - acc,
        0
      );

  const [durationA, durationB] = [a, b].map((interval) =>
    getDurationMinutes(interval)
  );

  return durationA > durationB
    ? -1
    : durationA < durationB
    ? 1
    : a > b
    ? 1
    : -1;
}

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
 * @DUPICATE in @eisbuk/ui/src/utils/sort.ts
 * @TODO_SORT
 */
export function comparePeriods(a: SlotInterval, b: SlotInterval): number;
export function comparePeriods(a: string, b: string): number;
export function comparePeriods(
  _a: string | SlotInterval,
  _b: string | SlotInterval
): number {
  const a = typeof _a === "string" ? _a : getIntervalString(_a);
  const b = typeof _b === "string" ? _b : getIntervalString(_b);

  const [firstStart, firstEnd] = a.split("-");
  const [secondStart, secondEnd] = b.split("-");

  switch (true) {
    case a === b:
      return 0;

    case firstStart < secondStart:
      return -1;

    case firstStart > secondStart:
      return 1;

    default:
      return firstEnd > secondEnd ? -1 : 1;
  }
}
