import { DateTime } from "luxon";

import { SlotInterface, SlotInterval } from "@eisbuk/shared";

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

/**
 * @param  {string} location (for instance website.web.app)
 * @returns string

Firebase hosting has a concept of "preview channels":
https://firebase.google.com/docs/hosting/test-preview-deploy
When deployed this way, apps will be served on a URL derived from the main
hosting URL. For instance, for appname.web.app, a preview channel named new-feature
can be published at https://appname--new-feature-randomhash.web.app/
*/
export const getOrgFromLocation = (location: string): string =>
  location.replace(/--[^.]+/, "");

/**
 * Checks if we've recieved and empty object.
 */
export const isEmpty = (input: unknown): boolean =>
  [undefined, null].includes(input as any)
    ? true
    : input instanceof Object && Object.values(input).length === 0
    ? true
    : false;

/**
 * Check if the phone string is a valid phone number
 */
export const isValidPhoneNumber = (phone?: string): boolean =>
  !phone ? false : /^(\+|00)[0-9]{9,16}$/.test(phone.replace(/\s/g, ""));
