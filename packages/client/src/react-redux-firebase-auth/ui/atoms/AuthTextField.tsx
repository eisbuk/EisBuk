import React, { useState } from "react";
import { Field, FieldConfig } from "formik";

import {
  AddOnAdornment,
  HoverText,
  IconButton,
  TextInput,
  TextInputProps,
} from "@eisbuk/ui";
import { Eye, EyeOff } from "@eisbuk/svg";

export type AuthTextFieldProps = FieldConfig<string> & Partial<TextInputProps>;

export type AuthTextFieldLookup<I extends string> = Partial<
  Record<I, Array<AuthTextFieldProps>>
>;

const AuthTextField: React.FC<AuthTextFieldProps> = ({
  name,
  type: typeProp,
  inputMode,
  prefix,
  ...props
}) => {
  const [showText, setShowText] = useState(false);
  const type = showText ? "text" : typeProp || "text";

  const togglePasswordVisibility = () => setShowText(!showText);

  const adornments: Pick<TextInputProps, "StartAdornment" | "EndAdornment"> =
    {};

  // show password visibility button only for password
  if (typeProp === "password") {
    const hoverText = showText ? "hide password" : "show password";
    const icon = showText ? <EyeOff /> : <Eye />;

    adornments["EndAdornment"] = (
      <HoverText className="flex items-center justify-center" text={hoverText}>
        <IconButton
          type="button"
          className="pr-3"
          onClick={togglePasswordVisibility}
        >
          {icon}
        </IconButton>
      </HoverText>
    );
  }

  if (prefix) {
    adornments["StartAdornment"] = <AddOnAdornment label={prefix} />;
  }

  return (
    <Field
      inputProps={{ inputMode }}
      name={name}
      label={name}
      type={type}
      {...props}
      component={TextInput}
      onBlur={() => {}}
      {...adornments}
    />
  );
};

export default AuthTextField;
