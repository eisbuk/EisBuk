import { FieldInputProps } from "formik";
import React, { useState } from "react";

import TextInput, { DropdownAdornment, TextInputProps } from "../TextInput";

interface Props extends Omit<TextInputProps, "type" | "inputMode"> {
  defaultCountry?: string;
}

const dummyCountryCodes = [
  {
    label: "IT",
    value: "+39",
  },
  {
    label: "FR",
    value: "+33",
  },
  {
    label: "HR",
    value: "+385",
  },
];

const findCountryByPrefix = (prefix: string) =>
  dummyCountryCodes.find(({ value }) => value === prefix);

const getCountryPrefix = (country: string) =>
  dummyCountryCodes.find(({ label }) => label === country)?.value || "";

const extractCountryPrefix = (phone: string) => {
  const country =
    // Try matching countries with 3 number prefix
    findCountryByPrefix(phone.substring(0, 4)) ||
    // If not found, try matching countries with 2 number prefix
    findCountryByPrefix(phone.substring(0, 3));

  if (country) {
    return country.value;
  }

  return "";
};

const initCountryDropdown = (
  defaultCountry: string | undefined,
  fieldValue?: string
) => {
  // If field value (phone string) provided, and starts with country prefix
  // try and infer the country
  let prefix = fieldValue?.startsWith("+") && extractCountryPrefix(fieldValue);

  // If no field value, or country not found set a default value
  if (!prefix) {
    prefix = !defaultCountry
      ? dummyCountryCodes[0].value
      : // Get dial code for a 'defaultCountry'
        getCountryPrefix(defaultCountry) ||
        // If country prefix not found, return first country on the list (as default)
        dummyCountryCodes[0].value;
  }

  return prefix;
};

const PhoneInput: React.FC<Props> = ({
  field: f,
  defaultCountry,
  ...props
}) => {
  const {
    onChange,
    value: fieldValue,
    name,
    ...field
  } = f as FieldInputProps<string>;

  const [countryCode, setCountryCode] = useState(() =>
    initCountryDropdown(defaultCountry, fieldValue)
  );

  // Get text input value by removing the country code from the full form value
  const textValue = fieldValue.replace(countryCode, "");

  // Update form value on text input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTextValue = e.target.value;
    const value = countryCode + newTextValue;

    onChange({ target: { name, value } });
  };

  // Update form value on country code change
  const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;

    setCountryCode(newCountryCode);

    // Don't call on change if there's no phone value besides the dial code
    if (textValue) {
      const value = newCountryCode + textValue;
      onChange({ target: { name, value } });
    }
  };

  return (
    <TextInput
      {...props}
      field={{ ...field, value: textValue, name, onChange: handleChange }}
      StartAdornment={
        <DropdownAdornment
          onChange={handleCodeChange}
          label="country"
          options={dummyCountryCodes}
        />
      }
    />
  );
};

export default PhoneInput;
