import React from "react";
import LuxonUtils from "@date-io/luxon";
import { SnackbarProvider } from "notistack";
import { Provider as ReduxProvider } from "react-redux";
import { getAuth } from "@firebase/auth";

import CssBaseline from "@material-ui/core/CssBaseline";
import MuiPickersUtilsProvider from "@material-ui/pickers/MuiPickersUtilsProvider";
import { ThemeProvider } from "@material-ui/core/styles";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { store } from "@/store";

import AppContent from "@/AppContent";

import Notifier from "@/components/Notifier";

import useConnectAuthToStore from "@/store/firestore/useConnectAuthToStore";

import { currentTheme } from "@/themes";
import { Button } from "@material-ui/core";

const App: React.FC = () => {
  const classes = useStyles();

  // connect auth to store to recieve firebase SDK's auth updates
  // through redux store
  useConnectAuthToStore(getAuth(), store);

  const breakTheApp = () => {
    throw new Error("Why Lisa, whyyy !?");
  };

  return (
    <ReduxProvider store={store}>
      <ThemeProvider theme={currentTheme}>
        <MuiPickersUtilsProvider utils={LuxonUtils}>
          <SnackbarProvider className={classes.root} maxSnack={3}>
            <Button
              variant="contained"
              color="secondary"
              style={{
                position: "fixed",
                top: "2rem",
                left: "2rem",
                zIndex: 10,
              }}
              onClick={breakTheApp}
            >
              Break me
            </Button>
            <Notifier />
            <CssBaseline />
            <AppContent />
          </SnackbarProvider>
        </MuiPickersUtilsProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
};

// #region styles
const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(0.75, 0),

    /**
     * This is, hopefully, temporary workaround to a
     * bug in notistack that causes snackbars to be unclickable.
     * Notistack v.1.0.10 fixes that bug, however,
     * it only works with materialUI v^5, which is in pre-release currently.
     * The bug is caused by the root class not having the 'pointerEvents'
     * property set to 'all', 'root' class here overrides that.
     * @TODO upgade MUI, notistack and remove this when MUI v5 becomes the LTS
     */
    pointerEvents: "all",
  },
}));
// #region styles

export default App;
