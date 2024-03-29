import { FieldInputProps, FieldProps } from "formik";
import React, { useState } from "react";

import { Phone } from "@eisbuk/svg";

import TextInput, { IconAdornment, TextInputProps } from "../TextInput";

import CountryCodesDropdown, {
  splitByDialCode,
  getDefaultCountryDialCode,
} from "../CountryCodesDropdown";

export interface PhoneInputProps
  extends Omit<TextInputProps, "type" | "inputMode"> {
  /**
   * Default country dial code (e.g. "+39" for Italy)
   */
  defaultDialCode?: string;
}
type PhoneInputFieldProps = PhoneInputProps & Omit<FieldProps, "meta">;

/**
 * A function to initialise country dropdown. Tries to infer the
 * dial code from `fieldValue` (if any). If the `fieldValue` empty ("")
 * uses the `defaultDialCode` if provided. If no `defaultDialCode` provided
 * falls back to the dial code of the first country in the country dial code list.
 *
 * Written to return a function rather than a value, so that the function is (when used as `useState` initializer)
 * ran only on init, rather than each time.
 * @param {string} defaultDialCode an (optional) dial code to use as afallback if one can't be inferred from the `fieldValue`
 * @param {string} fieldValue a full value of the field (e.g. +399891234567) used to infer the country code from the value
 */
const initCountryDropdown =
  (defaultDialCode: string | undefined, fieldValue: string) => () => {
    let [prefix] = splitByDialCode(fieldValue);

    // If no field value, or country not found set a default value
    if (!prefix) {
      prefix = getDefaultCountryDialCode(defaultDialCode);
    }

    return prefix;
  };

const PhoneInput: React.FC<PhoneInputFieldProps> = ({
  field: f,
  defaultDialCode,
  disabled,
  ...props
}) => {
  const {
    onChange,
    value: fieldValue = "",
    name,
    onBlur,
    ...field
  } = f as FieldInputProps<string | undefined>;

  // Local state used to control the country code dropdown
  const [dialCode, setDialCode] = useState(
    initCountryDropdown(defaultDialCode, fieldValue)
  );

  // On each change (as well as initial render), split the dial code and 'textValue' from the full 'fieldValue'
  const [dc, textValue] = splitByDialCode(fieldValue);
  // Update the local 'dialCode' only if the dial code extracted from the 'fieldValue' is defined and different from the current one
  if (dc && dc !== dialCode) {
    setDialCode(dc);
  }

  // On text part of the phone input change, update the full value to the form. If text
  // deleted. update the empty ("") value, without the 'dialCode'
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTextValue = e.target.value;
    const value = newTextValue ? dialCode + newTextValue : "";
    onChange({ target: { name, value } });
  };

  // On dial code change, alway update the local state, but lift updates to
  // the field, only if 'textValue' defined
  const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDialCode = e.target.value;

    setDialCode(newDialCode);

    if (textValue) {
      const value = newDialCode + textValue;
      onChange({ target: { name, value } });
    }
  };

  // Remove whitespaces on blur and lift the event
  const handleTextBlur = () => {
    const value = fieldValue.replaceAll(" ", "");
    onChange({ target: { name, value } });
    onBlur({ target: { name, value } });
  };

  return (
    <TextInput
      {...props}
      disabled={disabled}
      field={{
        ...field,
        // If disabled, we're showing the full text value (including the dial code), without the dial code picker
        value: disabled ? fieldValue : textValue,
        name,
        onChange: handleTextChange,
        onBlur: handleTextBlur,
      }}
      StartAdornment={
        // We're showing only the text value if the field is disabled
        // (with a start adornment icon for some eye candy)
        disabled ? (
          <IconAdornment Icon={Phone} position="start" disabled={true} />
        ) : (
          <CountryCodesDropdown
            onChange={handleCodeChange}
            name="dialCode"
            className="border-0 border-r !rounded-r-none !border-gray-300 px-6 cursor-pointer"
            value={dialCode}
          />
        )
      }
    />
  );
};

export default PhoneInput;
