import React from "react";

import TextInput, { DropdownAdornment, TextInputProps } from "../TextInput";

interface Props extends Omit<TextInputProps, "type" | "inputMode"> {
  defaultCountry?: string;
}

const PhoneInput: React.FC<Props> = (props) => (
  <TextInput
    {...props}
    StartAdornment={
      <DropdownAdornment label="country" options={["US", "CA", "EU"]} />
    }
  />
);

export default PhoneInput;
