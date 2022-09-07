/* eslint-disable camelcase */
import countryCodes from "./codes.json";

// Finds country (from the list of countries) by dial code (e.g. "+39")
export const findCountryByDialCode = (prefix: string) =>
  countryCodes.find(({ dial_code }) => dial_code === prefix);

// Gets dial code (e.g. "+39") for a country based on provided country's code (e.g. "IT")
export const getCountryDialCode = (countryCode: string) =>
  countryCodes.find(({ code }) => code === countryCode)?.dial_code || "";

// Gets a dial code (e.g. "+39") for a default country. The default country is
// found by the 'defaultCountryCode' (e.g. "IT") if provided, or the first country in
// the list, if 'defaultCountryCode' not provided
export const getDefaultCountryDialCode = (
  defaultCountryCode: string | undefined
) =>
  !defaultCountryCode
    ? countryCodes[0].dial_code
    : // Get dial code for a default country
      getCountryDialCode(defaultCountryCode) ||
      // If country prefix not found, return first country on the list (as default)
      countryCodes[0].dial_code;

export const extractCountryDialCode = (phone: string) => {
  const country =
    // Try matching countries with 4 number prefix
    findCountryByDialCode(phone.substring(0, 5)) ||
    // If not found, try matching countries with 3 number prefix
    findCountryByDialCode(phone.substring(0, 4)) ||
    // If not found, try matching countries with 2 number prefix
    findCountryByDialCode(phone.substring(0, 3));

  if (country) {
    return country.dial_code;
  }

  return "";
};

export const countryCodeOptions = countryCodes.map(({ dial_code, code }) => ({
  label: `${code} (${dial_code})`,
  value: dial_code,
}));
