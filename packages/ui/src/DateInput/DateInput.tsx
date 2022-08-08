import React, { useState, useEffect } from "react";

import { useTranslation, DateFormat } from "@eisbuk/translations";

import { dateToISO, isoToDate } from "../utils/date";
import TextInput, { TextInputProps } from "../TextInput";

const DateInput: React.FC<TextInputProps> = ({ ...props }) => {
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
    />
  );
};

export default DateInput;
