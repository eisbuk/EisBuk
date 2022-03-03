import React from "react";

import makeStyles from "@material-ui/core/styles/makeStyles";

interface Props {
  variant: "empty" | "fill";
  onClick: () => void;
}

export const ActionButton: React.FC<Props> = ({
  onClick,
  children,
  variant,
}) => {
  const classes = useStyles();

  return (
    <button
      className={[classes.button, classes[variant]].join(" ")}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const ActionButtonContainer: React.FC = ({ children }) => {
  const classes = useStyles();
  return <div className={classes.buttonsContainer}>{children}</div>;
};

const useStyles = makeStyles((theme) => ({
  buttonsContainer: {
    paddingTop: 8,
    display: "flex",
    justifyContent: "flex-end",
  },
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
