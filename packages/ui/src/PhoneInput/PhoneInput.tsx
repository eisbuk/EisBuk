import { FieldInputProps } from "formik";
import React, { useState } from "react";

import TextInput, { TextInputProps } from "../TextInput";
import Dropdown from "../Dropdown";

import {
  countryCodeOptions,
  extractCountryDialCode,
  getDefaultCountryDialCode,
} from "./data";

interface Props extends Omit<TextInputProps, "type" | "inputMode"> {
  defaultCountryCode?: string;
}

const initCountryDropdown = (
  defaultCountryCode: string | undefined,
  fieldValue?: string
) => {
  // If field value (phone string) provided, and starts with country prefix
  // try and infer the country
  let prefix =
    fieldValue?.startsWith("+") && extractCountryDialCode(fieldValue);

  // If no field value, or country not found set a default value
  if (!prefix) {
    prefix = getDefaultCountryDialCode(defaultCountryCode);
  }

  return prefix;
};

const PhoneInput: React.FC<Props> = ({
  field: f,
  defaultCountryCode,
  ...props
}) => {
  const {
    onChange,
    value: fieldValue,
    name,
    ...field
  } = f as FieldInputProps<string | undefined>;

  const [dialCode, setDialCode] = useState(() =>
    initCountryDropdown(defaultCountryCode, fieldValue)
  );

  // Get text input value by removing the country code from the full form value
  const textValue = fieldValue?.replace(dialCode, "");

  // Update form value on text input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTextValue = e.target.value;
    const value = dialCode + newTextValue;

    onChange({ target: { name, value } });
  };

  // Update form value on country code change
  const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;

    setDialCode(newCountryCode);

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
        <Dropdown
          onChange={handleCodeChange}
          label="country"
          options={countryCodeOptions}
          className="border-0 border-r !rounded-r-none !border-gray-300 px-6 cursor-pointer"
          value={dialCode}
        />
      }
    />
  );
};

export default PhoneInput;
