import React from "react";
import { useTranslation } from "react-i18next";

import makeStyles from "@mui/styles/makeStyles";

interface Props extends Omit<React.HTMLAttributes<HTMLElement>, "translate"> {
  as?: keyof JSX.IntrinsicElements;
  translate?: boolean;
  overridePosition?: boolean;
  overrideFontStyles?: boolean;
}

/**
 * A custom error message component used to ensure consistent styles (reduce redundant code)
 * for all error displaying.
 *
 * _Additionally: translates passed error messages and performs checks (in case error is not a string)_
 * @param param0
 * @returns
 */
const ErrorMessage: React.FC<Props> = ({
  children,
  as = "span",
  translate = true,
  className: inputClasses = "",
  overrideFontStyles = false,
  overridePosition = false,
  ...props
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const classes = useStyles();

  const displayMessage =
    typeof children !== "string" ? "" : translate ? t(children) : children;

  const className = [
    overridePosition ? "" : classes.position,
    overrideFontStyles ? "" : classes.font,
    inputClasses,
  ]
    .join(" ")
    .trim()
    .replace(/[\s]+/, " ");

  return React.createElement(as, { ...props, className }, displayMessage);
};

const useStyles = makeStyles((theme) => ({
  position: {
    display: "block",
    margin: "3px 14px 0px 14px",
    textAlign: "left",
  },
  font: {
    fontSize: "0.75rem",
    fontFamily: theme.typography.fontFamily,
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: "0.03333em",
    color: theme.palette.error.main,
  },
}));

export default ErrorMessage;
