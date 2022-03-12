import React, { useRef } from "react";
import { useTranslation } from "react-i18next";

import Typography from "@mui/material/Typography";

import makeStyles from "@mui/styles/makeStyles";

import { ActionButton } from "@/enums/translations";

import useClickOutside from "@/hooks/useClickOutside";

interface Props {
  message: string;
  open?: boolean;
  onClose?: () => void;
}

const AuthErrorDialog: React.FC<Props> = ({
  message,
  open = true,
  onClose = () => {},
}) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement>(null);

  // close the dialog on outside click
  useClickOutside(containerRef, onClose);

  if (!open) return null;

  return (
    <div ref={containerRef} className={classes.container}>
      <Typography className={classes.errorMessage} variant="caption">
        <span>{message} </span>
        <span className={classes.dismiss} onClick={onClose}>
          {t(ActionButton.Dismiss)}
        </span>
      </Typography>
    </div>
  );
};

const useStyles = makeStyles(() => ({
  container: {
    position: "absolute",
    top: 0,
    left: "10%",
    right: "10%",
    padding: "0.5rem 1rem",
    textAlign: "center",
    backgroundColor: "#f9edbe",
    border: "1px solid #f0c36d",
  },
  errorMessage: {
    fontSize: 12,
    font: "Roboto,Arial, sans-serif",
    color: "#000000",
  },
  dismiss: {
    color: "#4285f4",
    cursor: "pointer",
  },
}));

export default AuthErrorDialog;
