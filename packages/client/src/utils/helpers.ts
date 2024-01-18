import { FormikErrors } from "formik";
import { DateTime } from "luxon";
import { OrganizationData } from "@eisbuk/shared";

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
 * interpolate text including <p/>
 * @param template - String to be interpolated
 * @returns string of interpolated text
 */
export const replaceHTMLTags = (template: string) => {
  // eslint-disable-next-line no-irregular-whitespace
  const regex = new RegExp(/( |<([^>]+)>)/gi);
  return template.replaceAll(regex, "");
};

/**
 * Inserts a placeholder value into an input field and updates the corresponding Formik field.
 * @param setFieldValue - The Formik `setFieldValue` function to update the field value.
 * @param input - Reference to the input element.
 * @param type - The type of template ie email or sms
 * @returns A function that takes a button value and inserts it into the input field.
 */

export const insertValuePlaceholder =
  (
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean | undefined
    ) => Promise<void | FormikErrors<OrganizationData>>,
    input: React.MutableRefObject<HTMLInputElement | null>,
    type: "emailTemplates" | "smsTemplates"
  ) =>
  (buttonValue: string) =>
  () => {
    if (!input.current) return;

    const [start, end] = getInputSelection(input.current);

    const { name, value } = input.current;

    const inputValue =
      // Format the placeholder value, add anchor tag to links, where aplicable
      formatValuePlaceholder(buttonValue, type === "emailTemplates");

    const updatedValue = stringInsert(value, start, end, inputValue);

    setFieldValue(name, updatedValue);

    input.current.focus();
    // Set selection to the end of the inserted value, after the field has been focused (hence the timeout)
    const cursorPosition = start + inputValue.length;
    const setSelection = () =>
      input.current?.setSelectionRange(cursorPosition, cursorPosition);
    setTimeout(setSelection, 5);
  };

const stringInsert = (
  string: string,
  start: number,
  end: number,
  value: string
) => [string.slice(0, start), value, string.slice(end)].join("");

const getInputSelection = (input: HTMLInputElement) => [
  input.selectionStart || 0,
  input.selectionEnd || 0,
];

const formatValuePlaceholder = (value: string, wrapLinks: boolean) => {
  switch (value) {
    case "icsFile":
      if (wrapLinks) {
        return '<a href="{{ icsFile }}">Clicca qui per aggiungere le tue prenotazioni al tuo calendario</a>';
      }
    // eslint-disable-next-line no-fallthrough
    case "bookingsLink":
      if (wrapLinks) {
        return '<a href="{{ bookingsLink }}">Clicca qui per prenotare e gestire le tue lezioni</a>';
      }
    // eslint-disable-next-line no-fallthrough
    default:
      return `{{ ${value} }}`;
  }
};
