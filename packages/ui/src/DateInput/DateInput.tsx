import React, { useState, useEffect } from "react";

import { useTranslation, DateFormat } from "@eisbuk/translations";

import { dateToISO, isoToDate } from "../utils/date";
import TextInput, { TextInputFieldProps } from "../TextInput";

const DateInput: React.FC<TextInputFieldProps> = ({ ...props }) => {
  const { field, form } = props;

  const { value: inputValue } = field;
  const { setFieldValue } = form;

  const { t } = useTranslation();
  const [value, setValue] = useState(inputValue || "");

  useEffect(() => {
    if (inputValue !== value) {
      setValue(inputValue);
    }
  }, [inputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const isoDate = dateToISO(e.target.value);
    setValue(isoDate);
    setFieldValue(field.name, isoDate, true);
  };

  /**
   * This weird function handles an edge case where this field is used inside a form (probably always),
   * the user wishes to submit the form by pressing Enter, but this field is the last one edited.
   * In that case, the field doesn't get blurred and the corrected ISO value doesn't get updated to the form.
   *
   * This way we're stopping the event propagation, blurring the field and manually dispatching a click event on the submit button.
   */
  const handleEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
      const submit = e.currentTarget.form?.querySelector(
        'button[type="submit"]'
      );
      submit?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
    // Leave a warning, letting us know if this handler is blocking a different key
    // for easier debugging
    console.warn(
      "The DateInout componen is handling onKeyDown for 'Enter' key (submit) purposes. If you're trying to use a different keydown event, it's probably being blocked in ui/src/DateInput component."
    );
  };

  const _field = {
    ...field,
    value: isoToDate(value),
  };

  return (
    <TextInput
      {...props}
      field={_field}
      placeholder={t(DateFormat.Placeholder)}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleEnterSubmit}
    />
  );
};

export default DateInput;
