import React, { useEffect } from "react";
import { ErrorMessage, useField } from "formik";
import { DateTime } from "luxon";

import TextField, { TextFieldProps } from "@material-ui/core/TextField";
import Box from "@material-ui/core/Box";
import IconButton from "@material-ui/core/IconButton";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { __invalidTime, __requiredField } from "@/lib/errorMessages";

import { __decrementId__, __incrementId__ } from "./__testData__/testIds";
import { useTranslation } from "react-i18next";

type Props = Omit<Omit<TextFieldProps, "name">, "value"> & {
  /**
   * Name for the input field. Used for HTML input element,
   * as well as a parameter for `useField()` hook
   */
  name: string;
  /**
   * Optional: explicitly set `value` for the input field.
   * If not provided, falls back to `value` received from `useField()` context
   */
  value?: string;
  /**
   * Optional: change handler, accepts changed value string and `shouldValidate` boolean (always true).
   * If not provided, will default to `useField()` context's `setValue`
   */
  onChange?: (value: string) => void;
};

/**
 * Formik time input field with text input and `+`/`-` buttons.
 * - can update time directly (by typing)
 * - or increment/decrement by hour using `+`/`-` buttons
 *
 * Accepts optional `name` and `onChange` params
 * to be used as field `value` and an `onChange` handler (receiving changed value) respectively.
 * If no props for `value` or `onChange` received, defaults to `Formik`'s `useField()` context.
 *
 * **Important:** should be rendered as a decendant of `<Formik>` element (for context) and will throw otherwise.
 */
const TimePickerField: React.FC<Props> = ({ name, ...props }) => {
  const { t } = useTranslation();

  const [
    { value: contextValue },
    { error },
    { setValue, setError },
  ] = useField<string>(name);

  interface UpdateChange {
    (value: string, shouldValidate?: boolean): void;
  }
  const classes = useStyles();

  /**
   * Function in charge of dispatching chage of value in appropriate way.
   * - if `onChange` prop was provided, will dispatch changed value only to onChange function
   * - if no `onChange` prop was provided, will dispatch `setValue` received from `useField()` context
   */
  const updateChange: UpdateChange = props.onChange ?? setValue;
  /**
   * Field `value`:
   * - if explicitly provided (as prop), will use the value from props
   * - if not explicitly set, will use the one received from `useField` context
   */
  const value = props.value ?? contextValue;

  /**
   * Change handler function, used to handle direct change (typing) of input.
   * @param e change event
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // update new value
    updateChange(newValue, true);

    // check new value for errors
    switch (true) {
      case newValue === "":
        setError(t(__requiredField));
        break;
      case !/[0-9][0-9]-[0-9][0-9]/.test(newValue):
        setError(t(__invalidTime));
        break;
    }
  };

  /**
   * HOF returns appropriate `onClick` handler for increment/decrement.
   * @param delta value of hour difference:
   * - -1 for decrement
   * - 1 for increment
   */
  const handleClick = (delta: -1 | 1) => () => {
    const luxonTime = DateTime.fromISO(value);
    const newLuxonTime = luxonTime.plus({ hours: delta });
    const newTime = newLuxonTime.toISOTime().substr(0, 5);
    updateChange(newTime, true);
  };

  return (
    <Box className={classes.root}>
      <IconButton
        color="primary"
        onClick={handleClick(-1)}
        data-testid={__decrementId__}
      >
        -
      </IconButton>
      <TextField {...props} onChange={handleChange} value={value} />
      <IconButton
        color="primary"
        onClick={handleClick(1)}
        data-testid={__incrementId__}
      >
        +
      </IconButton>
      <div>{error}</div>
    </Box>
  );
};

const useStyles = makeStyles(() => ({
  root: {
    whiteSpace: "nowrap",
    display: "flex",
    AlignItems: "center",
  },
}));

export default TimePickerField;
