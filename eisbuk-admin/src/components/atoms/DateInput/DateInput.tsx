import React from "react";
import { useField } from "formik";
import { useTranslation } from "react-i18next";

import { makeStyles } from "@material-ui/styles";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import { SvgComponent } from "@/types/components";

import { currentTheme } from "@/themes";

import { isISODay } from "@/utils/date";

interface Props {
  name: string;
  Icon?: SvgComponent;
  label?: string;
  className?: string;
}


const DateInput: React.FC<Props> = ({ name, Icon, label, className }) => {
  const { t } = useTranslation();
  const classes = useStyles();

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
        error={Boolean(error)}
      />
      <div className={classes.error}>{t(error)}</div>
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


// ***** Region Styles ***** //
type Theme = typeof currentTheme;

const useStyles = makeStyles((theme: Theme) => ({
  error: {
    margin: 0,
    fontSize: "0.75rem",
    marginTop: 3,
    textAlign: "left",
    fontFamily: theme.typography.fontFamily,
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: "0.03333em",
    marginLeft: 14,
    marginRight: 14,
    color: "#f44336"
  }
}));
// ***** End Region Styles ***** //

export default DateInput;
