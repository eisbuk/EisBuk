/* eslint-disable camelcase */
import countryCodes from "./codes.json";

export const findCountryByPrefix = (prefix: string) =>
  countryCodes.find(({ dial_code }) => dial_code === prefix);

export const getCountryPrefix = (country: string) =>
  countryCodes.find(({ code }) => code === country)?.dial_code || "";

export const getDefaultCountryCode = (defaultCountry: string | undefined) =>
  !defaultCountry
    ? countryCodes[0].dial_code
    : // Get dial code for a 'defaultCountry'
      getCountryPrefix(defaultCountry) ||
      // If country prefix not found, return first country on the list (as default)
      countryCodes[0].dial_code;

export const extractCountryPrefix = (phone: string) => {
  const country =
    // Try matching countries with 4 number prefix
    findCountryByPrefix(phone.substring(0, 5)) ||
    // If not found, try matching countries with 3 number prefix
    findCountryByPrefix(phone.substring(0, 4)) ||
    // If not found, try matching countries with 2 number prefix
    findCountryByPrefix(phone.substring(0, 3));

  if (country) {
    return country.dial_code;
  }

  return "";
};

export const countryCodeOptions = countryCodes.map(({ dial_code, code }) => ({
  label: `${code} (${dial_code})`,
  value: dial_code,
}));
