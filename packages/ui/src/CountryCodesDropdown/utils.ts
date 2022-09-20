/* eslint-disable camelcase */
import countryCodes from "./codes.json";

/**
 * Finds country (from the list of countries) by dial code (e.g. "+39").
 */
const findCountryByDialCode = (prefix: string) =>
  countryCodes.find(({ dial_code }) => dial_code === prefix);

/**
 * If the default dial code is provided, it returns it, if not,
 * returns the dial code of first country in the list.
 */
export const getDefaultCountryDialCode = (
  defaultDialCode: string | undefined
) => defaultDialCode || countryCodes[0].dial_code;

/**
 * A util used to extract the country dial code from the phone string.
 * If dial code can't be inferred, returns empty string for dial code
 * and the full `phone` input as the rest of the phone number.
 * @param {string} phone a string phone number (e.g. "+39991234567")
 * @returns a touple of [dialCode, restOfThePhoneNumber]
 * @exampe
 * ```
 * extractCountryDialCode("+39991234567") // returns ["+39","991234567"] (for Italy)
 * ```
 */
export const splitByDialCode = (phone: string): [string, string] => {
  const country =
    // Try matching countries with 4 number prefix
    findCountryByDialCode(phone.substring(0, 5)) ||
    // If not found, try matching countries with 3 number prefix
    findCountryByDialCode(phone.substring(0, 4)) ||
    // If not found, try matching countries with 2 number prefix
    findCountryByDialCode(phone.substring(0, 3));

  if (country) {
    return [country.dial_code, phone.replace(country.dial_code, "")];
  }

  return ["", phone];
};

/**
 * An array of `{value, label}` entries, to be used as `options` for the Dropdown element
 * where the `label` is composed of country code and dial code (e.g. `"IT (+39)"`)
 * and `value` is the dial code prefix for a country (e.g. `"+39"`)
 */
export const dialCodeOptions = countryCodes.map(({ dial_code, code }) => ({
  label: `${code} (${dial_code})`,
  value: dial_code,
}));
