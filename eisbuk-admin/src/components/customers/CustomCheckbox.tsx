import React from "react";
import { useField } from "formik";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

import makeStyles from "@material-ui/core/styles/makeStyles";

interface Props {
  name: string;
  label: string;
}

const CustomCheckbox: React.FC<Props> = ({ name, label }) => {
  const classes = useStyles();
  const [field] = useField({ name, type: "checkbox" });

  return (
    <FormControlLabel
      className={classes.container}
      control={<Checkbox {...field} />}
      label={label}
    />
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    padding: `0 ${theme.spacing(2)}px ${theme.spacing(3)}px ${theme.spacing(
      2
    )}px`,
  },
}));

export default CustomCheckbox;
