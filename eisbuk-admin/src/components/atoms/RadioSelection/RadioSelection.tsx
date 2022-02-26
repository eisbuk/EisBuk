import React from "react";
import { useField, FieldAttributes, Field } from "formik";
import { RadioGroup } from "formik-material-ui";

import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

import makeStyles from "@mui/styles/makeStyles";

import ErrorMessage from "@/components/atoms/ErrorMessage";

type Props = Omit<FieldAttributes<any>, "options"> & {
  options: { value: string; label: string }[];
};

/**
 * A generalized radio selection component ,
 * used for all single selection, multiple option inputs.
 *
 * Features styled (and standardized) `ErrorMessage` component
 * for consistent erorr displays.
 * @param param0
 * @returns
 */
const RadioSelection: React.FC<Props> = ({ options, ...props }) => {
  const classes = useStyles();

  const [field, { error }] = useField(props.name);

  return (
    <div className={classes.container}>
      <Field {...props} className={classes.field} component={RadioGroup} row>
        {options.map(({ label, value }) => (
          <FormControlLabel
            key={value}
            value={value}
            label={label}
            control={<Radio />}
            aria-checked={field.value === value ? "true" : "false"}
            aria-label={label}
          />
        ))}
      </Field>
      <ErrorMessage>{error}</ErrorMessage>
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  field: {
    display: "flex",
    justifyContent: "space-evenly",
  },
}));

export default RadioSelection;
