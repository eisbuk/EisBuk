import React from "react";

import { isISO } from "@/utils/date";

interface Props {
  onChange?: (value: string) => void;
  value?: string;
}

const DateInput: React.FC<Props> = ({ onChange = () => {}, value = "" }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = dateToISO(e.target.value);
    onChange(isoDate);
  };
  return <input value={isoToDate(value)} onChange={handleChange} type="text" />;
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
  const [year, month, day] = input.split(/[\-]/);
  return isISO(input) ? `${day}/${month}/${year}` : input;
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
  const [day, month, year] = input.split(/[\/\-\.]/);
  const isoString = `${year}-${month}-${day}`;
  return isISO(isoString) ? isoString : input;
};

export default DateInput;
