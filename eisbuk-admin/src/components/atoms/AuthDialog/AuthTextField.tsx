import React, { useState } from "react";
import {
  Field,
  FieldConfig,
  // useField
} from "formik";

import { InputProps } from "@material-ui/core";

import VisibilityOff from "@material-ui/icons/VisibilityOff";
import Visibility from "@material-ui/icons/Visibility";

import { TextField, TextFieldProps } from "formik-material-ui";

import makeStyles from "@material-ui/core/styles/makeStyles";

const AuthTextField: React.FC<FieldConfig<string> & Partial<TextFieldProps>> =
  ({ name, type: typeProp, ...props }) => {
    const classes = useStyles();

    // const [, { error }] = useField(name);
    // in case of password, we're using type
    // to control hiding/displaying ot the text
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
              InputProps,
            }}
            component={TextField}
            onBlur={() => {}}
          />
        </div>
        {/* <div className={classes.errorContainer}>{error}</div> */}
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
