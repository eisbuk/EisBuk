import React from "react";
import { useField } from "formik";

import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import makeStyles from "@mui/styles/makeStyles";

interface Props {
  name: string;
  label: string;
  value?: string;
  disabled?: boolean;
}

const CustomCheckbox: React.FC<Props> = ({
  name,
  label,
  disabled = false,
  value,
}) => {
  const classes = useStyles();
  const [field] = useField({ name, type: "checkbox", value });

  return (
    <FormControlLabel
      className={classes.container}
      control={<Checkbox disabled={disabled} {...field} />}
      label={label}
    />
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    padding: `0 ${theme.spacing(2)} ${theme.spacing(3)} ${theme.spacing(2)}px`,
  },
  errorMessage: {
    width: "100%",
    textAlign: "center",
    marginTop: "1rem",
    whitespace: "normal",
    fontSize: 14,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.error.dark,
  },
}));

export default CustomCheckbox;
