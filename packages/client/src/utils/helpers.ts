import { DateTime } from "luxon";

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

/**
 * Calculate milliseconds passed from start of day (for ISO time string, eg. "09:00")
 */
const getMillisFromMidnight = (time: string) =>
  time
    .split(":")
    .reduce((acc, curr, i) => acc + parseInt(curr) * 1000 * 60 ** (2 - i), 0);

/**
 * @param {string | null} interval - String slot interval
 * Converts a string slot interval to a number e.g:
 * `null => 0`;
 * `"21:00 - 21:20" => 0.5`;
 * `"16:00 - 17:00" => 1.0`;
 * `"22:00 - 23:30" => 1.5`;
 * `"22:00 - 24:00" => 2`;
 * `"22:20 - 24:00" => 2`;
 */
export const calculateIntervalDuration = (interval: string | null) => {
  if (interval === null) {
    return 0;
  }

  const [startTime, endTime] = interval.split("-");
  const hourInMillis = 3600000;

  const diffMillis =
    getMillisFromMidnight(endTime) - getMillisFromMidnight(startTime);

  return Math.ceil((diffMillis / hourInMillis) * 2) * 0.5;
};
/**
 * interpolate text including <p/>
 * @param template - String to be interpolated
 * @returns string of interpolated text
 */
export const replaceHTMLTags = (template: string) => {
  // eslint-disable-next-line no-irregular-whitespace
  const regex = new RegExp(/( |<([^>]+)>)/gi);
  return template.replaceAll(regex, "");
};
