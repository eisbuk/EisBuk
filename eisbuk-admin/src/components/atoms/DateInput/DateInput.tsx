import React, { useState, useEffect } from "react";
import { useField } from "formik";
import { useTranslation } from "react-i18next";

import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import { DateFormat } from "@/enums/translations";

import { SvgComponent } from "@/types/components";

import ErrorMessage from "@/components/atoms/ErrorMessage";

import { isISODay } from "@/utils/date";

interface Props {
  name: string;
  Icon?: SvgComponent;
  label?: string;
  className?: string;
}

interface DateInputProps extends Omit<Props, "name"> {
  error?: string;
  onChange: (value: string) => void;
  value?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  Icon,
  label,
  className,
  onChange,
  value: inputValue = "",
  error,
}) => {
  const { t } = useTranslation();

  const InputProps = Icon
    ? {
        startAdornment: (
          <InputAdornment position="start">
            <Icon color="disabled" />
          </InputAdornment>
        ),
      }
    : {};

  const [value, setValue] = useState(inputValue);

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

  return (
    <>
      <TextField
        {...{ InputProps }}
        label={label}
        className={className}
        variant="outlined"
        value={isoToDate(value)}
        onBlur={handleBlur}
        onChange={handleChange}
        type="text"
        placeholder={t(DateFormat.Placeholder)}
        error={Boolean(error)}
      />
      <ErrorMessage>{error}</ErrorMessage>
    </>
  );
};

/**
 *
 * @param param0
 * @returns
 */
const FormikDateInput: React.FC<Props> = ({ name, ...props }) => {
  const [{ value = "" }, { error = "" }, { setValue }] = useField<
    string | undefined
  >(name);

  return <DateInput {...{ ...props, value, error }} onChange={setValue} />;
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

export default FormikDateInput;
