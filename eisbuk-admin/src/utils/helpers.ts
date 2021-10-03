import { DateTime } from "luxon";
import { Timestamp } from "@google-cloud/firestore";

import { SlotInterface, SlotInterval } from "@/types/temp";

type Primitive = string | number | boolean;

// ***** Region Simple Helpers ***** //
/**
 * Returns initials from provided name and last name
 * @param name
 * @param surname
 * @returns
 */
export const getInitials = (name: string, surname: string): string =>
  `${name[0]}${surname[0]}`;

interface CheckIndex {
  <V>(value: V, index: number, origArray: Array<V>): boolean;
}

/**
 * Checks for provided value and index match the first occurrence of the said value in provided array
 * @param value to match
 * @param index of the value to check
 * @param origArray
 * @returns
 */
export const onlyUnique: CheckIndex = (value, index, origArray) =>
  origArray.indexOf(value) === index;

/**
 * Returns string passed as prop with capitalized first letter.
 * If separated by "-" symbol, returns every word capitalized.
 * @param str
 * @returns
 */
export const capitalizeFirst = (str: string): string => {
  const words = str.split("-");

  // if last recursive node, return processed string
  if (words.length === 1) {
    const word = words[0];
    return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
  }

  // if multi word, process all of the words
  return words.map((word) => capitalizeFirst(word)).join("-");
};

/**
 * - Calculates statistical mode (an array member with highest occurrence in the provided array)
 * - If two values have the same number of occurrences, returns null
 * @param arr array from which to calculate mode (all members need to be of same type)
 * @returns value of calculated mode or null
 * ```
 * mode([1, 2, 2]) = 2
 * mode(["bar", "foo", "bar"]) = "bar"
 * mode([1, 1, 2, 2]) = null
 * ```
 */
export const mode = <T extends Primitive>(arr: T[]): T | null => {
  // create an object with array values as keys and number of occurrences as values
  const occurrences: Record<string, number> = {};

  // holds the value with currently highest occurrence (while looping)
  let highestOccurrence: T = arr[0];
  // a flag which, if true at the end of execution (two occurrences are equal),
  // triggers return null
  let twoEqual = false;

  // loop through the array and find highest occurrence
  arr.forEach((value) => {
    // convert value to string for easier processing
    const stringValue = value.toString();
    // string representation of highest occurring value
    const highestOccurrenceString = highestOccurrence.toString();

    if (!occurrences[stringValue]) {
      // if new value add new key to ocurrences
      occurrences[stringValue] = 1;
    } else {
      occurrences[stringValue]++;
    }

    // update highest occurrence if needed
    if (occurrences[highestOccurrenceString] < occurrences[stringValue]) {
      highestOccurrence = value;
    }

    // check if two ocurrences are the same and add a flag
    twoEqual =
      occurrences[highestOccurrenceString] === occurrences[stringValue] &&
      highestOccurrenceString !== stringValue;
  });

  return twoEqual ? null : highestOccurrence;
};
// ***** End Region Simple Helpers ***** //

/**
 * Convert a firestore date to a luxon date
 * currently ignores microseconds since seconds are already
 * more than enough for our use case
 * @param fsdate
 * @returns
 */
export const fs2luxon = (fsdate: Timestamp): DateTime =>
  DateTime.fromMillis(fsdate.seconds * 1000);

// ***** Region To Flatten ***** //
interface ToFlatten {
  (toFlatten?: Record<string, any>[]): Record<string, any>;
}

/** @TODO This should maybe be called merge, since it essentially merges two or more objects, rather then flattening (lowering depth of object by one level) */
/**
 * Flatten a list of objects, i.e. return an obect with all properties
 * from all objects in the list. If a property is defined inside two objects
 * the last one will prevail
 * @param toFlatten a list of objects to merge
 * @returns one object as a result of merging all the objects from the toFlatten list
 */
export const flatten: ToFlatten = (toFlatten) =>
  !toFlatten
    ? {}
    : toFlatten.reduce((partial, el) => ({ ...partial, ...el }), {});
// ***** End Region To Flatten ***** //

// ***** Region Get Month String ***** //
interface GetMonthString {
  (startDate: DateTime, offset: number): string;
}

/**
 * Returns a string representing the month starting from startDate
 * and moving by offset.
 * getMonthStr(luxon`2021-01-02`, -1) → "2020-12"
 * @param startDate
 * @param offset
 * @returns
 */
export const getMonthStr: GetMonthString = (startDate, offset) =>
  startDate
    .startOf("month")
    .plus({ months: offset })
    .toISODate()
    .substring(0, 7);
// ***** End Region Get Month String ***** //

/**
 * Calculates the `startTime` of earliset interval and the `endTime` of latest interval,
 * @param intervals a record of all intervals
 * @returns a string representation of slot's timespan: `${startTime} - ${endTime}`
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
