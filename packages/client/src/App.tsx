import React from "react";
import { SnackbarProvider } from "notistack";
import { Provider as ReduxProvider } from "react-redux";
import { getAuth } from "@firebase/auth";

import CssBaseline from "@mui/material/CssBaseline";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DateAdapter from "@mui/lab/AdapterLuxon";
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";

import { store } from "@/store";

import AppContent from "@/AppContent";

import Notifier from "@/components/Notifier";
import { Modal } from "@/features/modal/components";

import useConnectAuthToStore from "@/react-redux-firebase/hooks/useConnectAuthToStore";

import { currentTheme } from "@/themes";

const App: React.FC = () => {
  // connect auth to store to recieve firebase SDK's auth updates
  // through redux store
  useConnectAuthToStore(getAuth(), store);

  return (
    <ReduxProvider store={store}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={currentTheme}>
          <LocalizationProvider dateAdapter={DateAdapter}>
            <SnackbarProvider maxSnack={3}>
              <Notifier />
              <CssBaseline />
              <AppContent />
              <Modal />
            </SnackbarProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </ReduxProvider>
  );
};

export default App;
