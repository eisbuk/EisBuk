import React from "react";

import makeStyles from "@material-ui/core/styles/makeStyles";

interface ButtonProps {
  color?: string;
  backgroundColor?: string;
  label: string;
  icon: string;
  onClick?: () => void;
}

const AuthButton: React.FC<ButtonProps> = ({
  label,
  icon,
  backgroundColor,
  color,
  onClick,
}) => {
  const classes = useStyles();

  return (
    <li className={classes.listItem}>
      <button
        className={classes.authButton}
        onClick={onClick}
        style={{
          backgroundColor: backgroundColor || "#ffff",
          color: color || "#0000",
        }}
      >
        <span className={classes.iconWrapper}>
          <img className={classes.icon} src={icon} />
        </span>
        <span style={{ color }} className={classes.label}>
          {label}
        </span>
      </button>
    </li>
  );
};

const useStyles = makeStyles(() => ({
  authButton: {
    fontWeight: 500,
    lineHeight: "normal",
    maxWidth: 220,
    minHeight: 40,
    padding: "0.5rem 1rem",
    width: "100%",
    textAlign: "left",
    boxShadow: "0 2px 2px #00000024, 0 3px 1px -2px #0003, 0 1px 5px #0000001f",
    border: "none",
    borderRadius: 2,
    position: "relative",
    margin: 0,
    minWidth: 64,
    display: "inline-block",
    fontFamily: "Roboto,Helvetica,Arial,sans-serif",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0,
    overflow: "hidden",
    outline: 0,
    cursor: "pointer",
    textDecoration: "none",
  },
  listItem: {
    margin: 0,
    padding: 0,
    marginBottom: 15,
    textAlign: "center",
    listStyle: "none",
  },
  iconWrapper: {
    display: "table-cell",
    verticalAlign: "middle",
  },
  icon: {
    display: "inline",
    height: 18,
    width: 18,
  },
  label: {
    fontSize: 14,
    paddingLeft: 16,
    textTransform: "none",
    verticalAlign: "middle",
    display: "table-cell",
  },
}));

export default AuthButton;
