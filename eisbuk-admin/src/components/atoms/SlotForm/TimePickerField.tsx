import React from "react";
import { useField } from "formik";
import { DateTime } from "luxon";

import TextField, { TextFieldProps } from "@material-ui/core/TextField";
import Box from "@material-ui/core/Box";
import IconButton from "@material-ui/core/IconButton";

import makeStyles from "@material-ui/core/styles/makeStyles";

import ErrorMessage from "@/components/atoms/ErrorMessage";

import { __decrementId__, __incrementId__ } from "./__testData__/testIds";

type Props = Omit<TextFieldProps, "name"> & {
  /**
   * Name for the input field. Used for HTML input element,
   * as well as a parameter for `useField()` hook
   */
  name: string;
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
  const classes = useStyles();

  const [{ value }, { error }, { setValue }] = useField<string>(name);

  /**
   * Change handler function, used to handle direct change (typing) of input.
   * @param e change event
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  /**
   * An `onBlur` handler used to add "0" prefix to single digit hours, i.e.
   * `"9:00"` -> `"09:00"`
   * @param e blur event
   */
  const correctTimestring = (e: React.FocusEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (/^[0-9]:[0-9][0-9]/.test(newValue)) {
      newValue = `0${newValue}`;
    }
    setValue(newValue);
  };

  /**
   * HOF returns appropriate `onClick` handler for increment/decrement.
   * @param delta value of hour difference:
   * - -1 for decrement
   * - 1 for increment
   */
  const handleClick = (delta: -1 | 1) => () => {
    // fallback time in case current value is not valid time string
    const fallbackTime = DateTime.fromISO("08:00");

    const luxonTime = DateTime.fromISO(value);

    // check if current value is a valid timestring
    const currentTimeValid = !luxonTime.invalidReason;

    const newLuxonTime = currentTimeValid
      ? luxonTime.plus({ hours: delta })
      : fallbackTime.plus({ hours: delta });
    const newTime = newLuxonTime.toISOTime().substr(0, 5);

    setValue(newTime);
  };

  return (
    <Box className={classes.container}>
      <IconButton
        color="primary"
        onClick={handleClick(-1)}
        data-testid={__decrementId__}
      >
        -
      </IconButton>
      <TextField
        {...props}
        onChange={handleChange}
        onBlur={correctTimestring}
        value={value}
      />
      <IconButton
        color="primary"
        onClick={handleClick(1)}
        data-testid={__incrementId__}
      >
        +
      </IconButton>
      <ErrorMessage className={classes.error} overridePosition>
        {error}
      </ErrorMessage>
    </Box>
  );
};

const useStyles = makeStyles(() => ({
  container: {
    position: "relative",
    padding: "1.75rem 0",
    display: "flex",
    alignItems: "center",
  },
  error: {
    position: "absolute",
    bottom: 8,
    left: "50%",
    width: "100%",
    display: "inline-block",
    whitespace: "nowrap",
    textAlign: "center",
    transform: "translateX(-50%)",
  },
}));

export default TimePickerField;
