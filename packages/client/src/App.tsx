import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { getAuth } from "@firebase/auth";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";

import { store } from "@/store";

import AppContent from "@/AppContent";

import { Modal } from "@/features/modal/components";

import useConnectAuthToStore from "@/react-redux-firebase-auth/hooks/useConnectAuthToStore";

import { currentTheme } from "@/themes";
import { NotificationsProvider } from "./features/notifications/context";

const App: React.FC = () => {
  // connect auth to store to recieve firebase SDK's auth updates
  // through redux store
  useConnectAuthToStore(getAuth(), store);

  return (
    <BrowserRouter>
      <ReduxProvider store={store}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={currentTheme}>
            <NotificationsProvider
              timeouts={{ minTimeout: 1200, maxTimeout: 2000 }}
            >
              <CssBaseline />
              <AppContent />
              <Modal />
            </NotificationsProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </ReduxProvider>
    </BrowserRouter>
  );
};

export default App;
