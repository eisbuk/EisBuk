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

const PhoneInput: React.FC<Props> = ({ field: f, ...props }) => {
  const [prefix, setPrefix] = useState("");

  const { onChange, value: v, name, ...field } = f as FieldInputProps<string>;
  const value = v.replace(prefix, "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Call 'onChange' with the change event as is
    // but create final value by prepending input with country prefix
    const value = prefix + e.target.value;
    onChange({ target: { name, value } });
  };

  return (
    <TextInput
      {...props}
      field={{ ...field, value, name, onChange: handleChange }}
      StartAdornment={
        <DropdownAdornment
          onChange={(e) => setPrefix(e.target.value)}
          label="country"
          options={dummyCountryCodes}
        />
      }
    />
  );
};

export default PhoneInput;
