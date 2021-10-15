import React from "react";
import { useField } from "formik";
import { useTranslation } from "react-i18next";

import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import { SvgComponent } from "@/types/components";

import { isISODay } from "@/utils/date";

interface Props {
  name: string;
  Icon?: SvgComponent;
  label?: string;
  className?: string;
}

const DateInput: React.FC<Props> = ({ name, Icon, label, className }) => {
  const { t } = useTranslation();

  const [{ value = "" }, { error = "" }, { setValue }] = useField<
    string | undefined
  >(name);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = dateToISO(e.target.value);
    setValue(isoDate);
  };

  const InputProps = Icon
    ? {
        startAdornment: (
          <InputAdornment position="start">
            <Icon color="disabled" />
          </InputAdornment>
        ),
      }
    : {};

  return (
    <>
      <TextField
        {...{ InputProps }}
        label={label}
        className={className}
        variant="outlined"
        value={isoToDate(value)}
        onChange={handleChange}
        type="text"
        placeholder="dd/mm/yyyy"
      />
      <div>{t(error)}</div>
    </>
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
  const [year, month, day] = input.split(/[\-]/);
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
  const [day, month, year] = input.split(/[\/\-\.]/);
  const isoString = `${year}-${month}-${day}`;
  return isISODay(isoString) ? isoString : input;
};

export default DateInput;
