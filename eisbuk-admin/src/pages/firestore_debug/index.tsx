import React from "react";
import firebase from "firebase/app";
import { isEmpty, isLoaded } from "react-redux-firebase";
import { useSelector } from "react-redux";

import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

import makeStyles from "@material-ui/core/styles/makeStyles";

import DebugSlotForm from "./DebugSlotForm";
import DebugCustomerForm from "./DebugCustomerForm";
import DebugBookingForm from "./DebugBookingForm";

import { createAdminTestUsers } from "@/components/debugPage";

import { getFirebaseAuth } from "@/store/selectors/auth";

const FirestoreDebug: React.FC = () => {
  const classes = useStyles();

  const auth = useSelector(getFirebaseAuth);

  const isAdmin = isLoaded(auth) && !isEmpty(auth);

  const logIn = async () => {
    try {
      await createAdminTestUsers();
    } catch {
      await firebase
        .auth()
        .signInWithEmailAndPassword("test@eisbuk.it", "test00");
    }
  };

  const logOut = async () => {
    await firebase.auth().signOut();
  };

  return (
    <Container>
      <Box className={classes.inline}>
        <Typography variant="h6">
          {"Click to toggle admin (login) state ->"}
        </Typography>
        <Button
          className={classes.button}
          variant="contained"
          style={{ color: "white", background: isAdmin ? "green" : "red" }}
          onClick={isAdmin ? logOut : logIn}
        >
          Admin
        </Button>
      </Box>
      <Paper elevation={2} className={classes.itemContainer}>
        <DebugSlotForm />
      </Paper>
      <Paper elevation={2} className={classes.itemContainer}>
        <DebugCustomerForm />
      </Paper>
      <Paper elevation={2} className={classes.itemContainer}>
        <DebugBookingForm />
      </Paper>
    </Container>
  );
};

const useStyles = makeStyles(() => ({
  itemContainer: {
    padding: "2rem",
  },
  inline: {
    display: "flex",
    justifyContent: "start",
    alignItems: "center",
  },
  button: {
    margin: "0 2rem",
  },
}));

export default FirestoreDebug;
