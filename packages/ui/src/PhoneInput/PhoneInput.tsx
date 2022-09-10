import { FieldInputProps } from "formik";
import React, { useState } from "react";

import TextInput, { TextInputProps } from "../TextInput";

import CountryCodesDropdown, {
  extractCountryDialCode,
  getDefaultCountryDialCode,
} from "../CountryCodesDropdown";

interface Props extends Omit<TextInputProps, "type" | "inputMode"> {
  /**
   * Default country dial code (e.g. "+39" for Italy)
   */
  defaultDialCode?: string;
}

const initCountryDropdown = (
  defaultDialCode: string | undefined,
  fieldValue?: string
) => {
  // If field value (phone string) provided, and starts with country prefix
  // try and infer the country
  let prefix =
    fieldValue?.startsWith("+") && extractCountryDialCode(fieldValue);

  // If no field value, or country not found set a default value
  if (!prefix) {
    prefix = getDefaultCountryDialCode(defaultDialCode);
  }

  return prefix;
};

const PhoneInput: React.FC<Props> = ({
  field: f,
  defaultDialCode,
  ...props
}) => {
  const {
    onChange,
    value: fieldValue,
    name,
    onBlur,
    ...field
  } = f as FieldInputProps<string | undefined>;

  const [dialCode, setDialCode] = useState(() =>
    initCountryDropdown(defaultDialCode, fieldValue)
  );

  // Get text input value by removing the country code from the full form value
  const textValue = fieldValue?.replace(dialCode, "");

  // Update form value on text input change
  const handleChange = (e: {
    // We only need the 'target.value' from the event object for this purpose
    // so this is easier for type compatibility in other functions calling to this one
    target: Pick<React.ChangeEvent<HTMLInputElement>["target"], "value">;
  }) => {
    const newTextValue = e.target.value;
    const value = dialCode + newTextValue;

    onChange({ target: { name, value } });
  };

  // Remove whitespaces onBlur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.replaceAll(" ", "");
    const evt = { target: { name, value } };

    handleChange(evt);
    onBlur(evt);
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
      field={{
        ...field,
        value: textValue,
        name,
        onChange: handleChange,
        onBlur: handleBlur,
      }}
      StartAdornment={
        <CountryCodesDropdown
          onChange={handleCodeChange}
          name="dialCode"
          className="border-0 border-r !rounded-r-none !border-gray-300 px-6 cursor-pointer"
          value={dialCode}
        />
      }
    />
  );
};

export default PhoneInput;
