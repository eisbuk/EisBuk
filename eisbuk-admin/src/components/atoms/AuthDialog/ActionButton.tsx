import React from "react";

import makeStyles from "@material-ui/core/styles/makeStyles";
import { Typography } from "@material-ui/core";

interface Props {
  variant: "empty" | "fill" | "text";
  onClick: () => void;
}

export const ActionButton: React.FC<Props> = ({
  onClick,
  children,
  variant,
}) => {
  const classes = useStyles();

  if (variant === "text") {
    return (
      <button className={classes.text}>
        <Typography variant="body2">{children}</Typography>
      </button>
    );
  }

  return (
    <button
      className={[classes.button, classes[variant]].join(" ")}
      onClick={onClick}
    >
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
