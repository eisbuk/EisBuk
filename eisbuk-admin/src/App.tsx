import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ReactReduxFirebaseProvider } from "react-redux-firebase";
import LuxonUtils from "@date-io/luxon";
import { SnackbarProvider } from "notistack";

import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { ThemeProvider } from "@material-ui/core/styles";
import { CssBaseline } from "@material-ui/core";

import { rrfProps, store } from "@/store";

import AppContent from "@/AppContent";

import Notifier from "@/utils/Notifier";

import { currentTheme } from "@/themes";

function App() {
  return (
    <Provider store={store}>
      <ReactReduxFirebaseProvider {...rrfProps}>
        <ThemeProvider theme={currentTheme}>
          <MuiPickersUtilsProvider utils={LuxonUtils}>
            <SnackbarProvider maxSnack={3}>
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
}

export default App;
