import React from "react";
import { FastField, FieldConfig, useField } from "formik";

import { TextField, TextFieldProps } from "formik-material-ui";

import makeStyles from "@material-ui/core/styles/makeStyles";

const AuthTextField: React.FC<
  FieldConfig<string> & Pick<TextFieldProps, "label">
> = ({ name, ...props }) => {
  const classes = useStyles();

  const [, { error }] = useField(name);

  return (
    <>
      <div className={classes.container}>
        <FastField
          className={classes.textField}
          {...{ name, ...props }}
          component={TextField}
          onBlur={() => {}}
        />
      </div>
      <div>{error}</div>
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
  },
  errorContainer: {
    width: "100%",
    height: "1rem",
  },
}));

export default AuthTextField;
