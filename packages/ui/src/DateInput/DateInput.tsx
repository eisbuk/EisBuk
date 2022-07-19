import React, { useState, useEffect } from "react";

import { useTranslation, DateFormat } from "@eisbuk/translations";

import { isISODay } from "../utils/date";
import TextInput, { TextInputProps } from "../TextInput";

const DateInput: React.FC<TextInputProps> = ({ formikField, ...props }) => {
  const { field } = formikField;

  const { value: inputValue, onChange } = field;

  const { t } = useTranslation();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (inputValue !== value) {
      setValue(inputValue);
    }
  }, [inputValue]);

  useEffect(() => {
    onChange(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const isoDate = dateToISO(e.target.value);
    setValue(isoDate);
  };

  const _field = {
    ...formikField,
    field: {
      ...field,
      value: isoToDate(value),
      onBlur: handleBlur,
      onChange: handleChange,
    },
  };

  return (
    <TextInput
      {...props}
      formikField={_field}
      placeholder={t(DateFormat.Placeholder)}
    />
  );
};

/**
 * A helper function that parses ISO string and returns a string in european date format
 * (`dd/mm/yyyy`)
 *
 * _if passed `input` is not a valid ISO string, it returns the `input` as is_
 * @param input ISO string to convert
 * @returns string
 */
const isoToDate = (input: string): string => {
  const [year, month, day] = input.split("-");
  return isISODay(input) ? `${day}/${month}/${year}` : input;
};

/**
 * A helper function that parses a valid european date separated by one of (. , / , -)
 * into an ISOString
 *
 * _if passed `input` is not a valid ISO string, it returns the `input` as is_
 * @param input user date input
 * @returns string
 */
const dateToISO = (input: string): string => {
  const [day, month, year] = input.split(/[-/.]/).map(twoDigits);
  const isoString = `${year}-${month}-${day}`;
  return isISODay(isoString) ? isoString : input;
};

const twoDigits = (value: string) =>
  Number(value).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });

export default DateInput;
