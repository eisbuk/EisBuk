import React, { useState } from "react";
import { Field, FieldConfig } from "formik";

import {
  HoverText,
  IconButton,
  TextInput,
  TextInputProps,
  PhoneInput,
} from "@eisbuk/ui";
import { Eye, EyeOff } from "@eisbuk/svg";
import i18n, { Forms } from "@eisbuk/translations";

export type AuthTextFieldProps = FieldConfig<string> & Partial<TextInputProps>;

export type AuthTextFieldLookup<I extends string> = Partial<
  Record<I, Array<AuthTextFieldProps>>
>;

const AuthTextField: React.FC<AuthTextFieldProps> = ({
  name,
  type: typeProp,
  inputMode,
  ...props
}) => {
  const [showText, setShowText] = useState(false);
  const type = showText ? "text" : typeProp || "text";

  const togglePasswordVisibility = () => setShowText(!showText);

  const adornments: Pick<TextInputProps, "StartAdornment" | "EndAdornment"> =
    {};

  // show password visibility button only for password
  if (typeProp === "password") {
    const hoverText = showText
      ? i18n.t(Forms.HidePassword)
      : i18n.t(Forms.ShowPassword);
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

  const component = inputMode === "tel" ? PhoneInput : TextInput;

  return (
    <Field
      inputProps={{ inputMode }}
      name={name}
      label={name}
      type={type}
      {...props}
      component={component}
      onBlur={() => {}}
      {...adornments}
    />
  );
};

export default AuthTextField;
