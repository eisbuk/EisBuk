import React, { useState } from "react";
import { Field, FieldConfig } from "formik";

import { InputProps } from "@mui/material";

import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";

import { TextField, TextFieldProps } from "formik-mui";

import makeStyles from "@mui/styles/makeStyles";

export type AuthTextFieldProps = FieldConfig<string> & Partial<TextFieldProps>;

export type AuthTextFieldLookup<I extends string> = Partial<
  Record<I, Array<AuthTextFieldProps & Record<string, any>>>
>;

const AuthTextField: React.FC<AuthTextFieldProps> = ({
  name,
  type: typeProp,
  inputMode,
  ...props
}) => {
  const classes = useStyles();

  const [showText, setShowText] = useState(false);
  const type = showText ? "text" : typeProp || "text";

  const togglePasswordVisibility = () => setShowText(!showText);

  const InputProps: InputProps =
    typeProp === "password"
      ? // show password visibility button only for password
        {
          endAdornment: (
            <button
              className={classes.showPasswordButton}
              onClick={togglePasswordVisibility}
              type="button"
            >
              {showText ? <VisibilityOff /> : <Visibility />}
            </button>
          ),
        }
      : {};

  return (
    <>
      <div className={classes.container}>
        <Field
          className={classes.textField}
          {...{
            name,
            ...props,
            type,
            inputMode,
            InputProps,
          }}
          component={TextField}
          onBlur={() => {}}
        />
      </div>
    </>
  );
};

const useStyles = makeStyles(() => ({
  container: {
    padding: "4px 0 20px 0",
    width: "100%",
  },
  textField: {
    width: "100%",
    position: "relative",
  },
  showPasswordButton: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translate(0, -50%)",
    background: "none",
    border: "none",
    outline: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  errorContainer: {
    width: "100%",
    height: "1rem",
  },
}));

export default AuthTextField;
