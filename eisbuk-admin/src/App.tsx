import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ReactReduxFirebaseProvider } from "react-redux-firebase";
import LuxonUtils from "@date-io/luxon";
import { SnackbarProvider } from "notistack";

import CssBaseline from "@material-ui/core/CssBaseline";
import MuiPickersUtilsProvider from "@material-ui/pickers/MuiPickersUtilsProvider";
import { ThemeProvider } from "@material-ui/core/styles";

import { rrfProps, store } from "@/store";

import AppContent from "@/AppContent";

import Notifier from "@/components/Notifier";

import { currentTheme } from "@/themes";
import makeStyles from "@material-ui/core/styles/makeStyles";

const App: React.FC = () => {
  const classes = useStyles();

  return (
    <Provider store={store}>
      <ReactReduxFirebaseProvider {...rrfProps}>
        <ThemeProvider theme={currentTheme}>
          <MuiPickersUtilsProvider utils={LuxonUtils}>
            <SnackbarProvider className={classes.root} maxSnack={3}>
              <Notifier />
              <CssBaseline />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </SnackbarProvider>
          </MuiPickersUtilsProvider>
        </ThemeProvider>
      </ReactReduxFirebaseProvider>
    </Provider>
  );
};

// ***** Region Styles ***** //
type Theme = typeof currentTheme;

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    margin: theme.spacing(0.75, 0),
    pointerEvents: "all",
  },
}));
// ***** End Region Styles ***** //
export default App;
