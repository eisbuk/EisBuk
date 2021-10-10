import React, { useState } from "react";

import Avatar from "@material-ui/core/Avatar";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/core/styles/makeStyles";

import LockOutlinedIcon from "@material-ui/icons/LockOutlined";

import LoginForm from "./LoginForm";

import { organizationInfo } from "@/themes";

const AuthDialog: React.FC = () => {
  const classes = useStyles();

  // controlls the different login view with respect to selected login method
  const [view, setView] = useState<"default" | "phone" | "email">("default");

  /**
   * Cancel handler for different login flows (returns to initial view)
   */
  const handleCancel = () => setView("default");

  /**
   * Handles google login flow
   */
  const handleGoogleLogin = () => {};

  const defaultView = (
    <>
      <Button
        variant="text"
        className={[classes.button, classes.phoneButton].join(" ")}
        onClick={() => setView("phone")}
      >
        Phone Login
      </Button>
      <Button
        variant="text"
        className={classes.button}
        onClick={handleGoogleLogin}
      >
        Google Login
      </Button>
      <Button
        variant="text"
        className={[classes.button, classes.emailButton].join(" ")}
        onClick={() => setView("email")}
      >
        Email Login
      </Button>
    </>
  );

  return (
    <Paper elevation={2} className={classes.paper}>
      <Avatar className={classes.avatar}>
        <LockOutlinedIcon />
      </Avatar>
      <Typography component="h1" variant="h5">
        {organizationInfo.name}
      </Typography>
      <div className={classes.actionContainer}>
        {view === "default" && defaultView}
        {view === "email" && <LoginForm onCancel={handleCancel} />}
      </div>
    </Paper>
  );
};

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(8, 4),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  actionContainer: {
    width: "12.5rem",
  },
  button: {
    width: "100%",
    boxShadow: "0 0 4px 2px rgba(0, 0, 0, 0.1)",
    marginTop: "1rem",
    marginBottom: "0.5rem",
    borderRadius: "0",
  },
  phoneButton: {
    background: "green",
    color: "white",
  },
  emailButton: {
    background: "red",
    color: "white",
  },
}));

export default AuthDialog;
