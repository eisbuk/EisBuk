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

const initCountryDropdown = (defaultCountry?: string) =>
  !defaultCountry
    ? dummyCountryCodes[0].value
    : // Get dial code for a 'defaultCountry'
      dummyCountryCodes.find(({ label }) => defaultCountry === label)?.value ||
      // If country not found, return first country on the list (as default)
      dummyCountryCodes[0].value;

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

  const [countryCode, setCountryCode] = useState(
    initCountryDropdown(defaultCountry)
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
    const value = newCountryCode + textValue;

    onChange({ target: { name, value } });
    setCountryCode(newCountryCode);
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
