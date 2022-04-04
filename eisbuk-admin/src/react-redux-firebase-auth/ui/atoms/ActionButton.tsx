import React, { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

import Typography from "@mui/material/Typography";

import makeStyles from "@mui/styles/makeStyles";

export interface ActionButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  variant: "empty" | "fill" | "text";
}

/**
 * Type of `actionButtonLookup` record.
 * A standardized type for creating lookup of buttons:
 * - indexed by `I` type param (extends string)
 * - each record entry is the array of button props, with `children` replaced by `label`
 * - button props can be extended with optional `E` param
 */
export type ActionButtonLookup<I extends string> = Partial<
  Record<
    I,
    Array<
      Omit<ActionButtonProps, "children"> & { label: string } & Record<
          string,
          any
        >
    >
  >
>;

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant,
  ...props
}) => {
  const classes = useStyles();

  if (variant === "text") {
    return (
      <button className={classes.text} {...props}>
        <Typography variant="body2">{children}</Typography>
      </button>
    );
  }

  return (
    <button className={[classes.button, classes[variant]].join(" ")} {...props}>
      {children}
    </button>
  );
};

const useStyles = makeStyles((theme) => ({
  button: {
    display: "inline-block",
    height: 36,
    marginLeft: 8,
    minWidth: 88,
    border: "none",
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
    padding: "0 1rem",
    fontFamily: "Roboto,Helvetica,Arial,sans-serif",
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: 0,
    textTransform: "uppercase",
    textDecoration: "none",
    verticalAlign: "middle",
    cursor: "pointer",
  },
  text: {
    color: theme.palette.info.main,
    border: "none",
    background: "none",
    ["&:hover"]: {
      textDecoration: "underline",
      cursor: "pointer",
    },
  },
  empty: {
    background: "none",
    color: theme.palette.primary.main,
    ["&:hover"]: { background: "#9e9e9e33" },
  },
  fill: {
    background: theme.palette.primary.main,
    color: "#ffff",
    boxShadow: "0 2px 2px #00000024, 0 3px 1px -2px #0003, 0 1px 5px #0000001f",
  },
}));

export default ActionButton;
