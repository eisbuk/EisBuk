import React from "react";
import { useField } from "formik";

import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import makeStyles from "@mui/styles/makeStyles";

interface Props {
  name: string;
  label: string;
  disabled?: boolean;
}

const CustomCheckbox: React.FC<Props> = ({ name, label, disabled = false }) => {
  const classes = useStyles();
  const [field] = useField({ name, type: "checkbox" });

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
}));

export default CustomCheckbox;
