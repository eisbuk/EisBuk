import React from "react";
import { DateTime } from "luxon";
import { useField } from "formik";

import { Plus, Minus } from "@eisbuk/svg";

import { testId } from "@eisbuk/testing/testIds";

import TextInput, { TextInputFieldProps } from "../../TextInput";
import IconButton from "../../IconButton";
import FormError from "../FormError";

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
const TimePickerField: React.FC<TextInputFieldProps> = ({ ...props }) => {
  const [{ value }, { error }, { setValue }] = useField<string>(
    props.field.name
  );

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
    <div className="relative flex items-center">
      <IconButton
        className="w-8 h-6 rounded-md bg-cyan-700 text-white !px-1.5 !py-1 flex-shrink-0 hover:bg-cyan-700 active:bg-cyan-600"
        onClick={handleClick(-1)}
        data-testid={testId("decrement-button")}
      >
        <Minus />
      </IconButton>
      <TextInput
        className="mx-2"
        {...props}
        onBlur={correctTimestring}
        error={Boolean(error || props.error)}
      />
      <IconButton
        className="w-8 h-6 rounded-md bg-cyan-700 text-white !px-1.5 !py-1 flex-shrink-0 hover:bg-cyan-700 active:bg-cyan-600"
        onClick={handleClick(1)}
        data-testid={testId("increment-button")}
      >
        <Plus />
      </IconButton>
      <FormError className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap">
        {error}
      </FormError>
    </div>
  );
};

export default TimePickerField;
