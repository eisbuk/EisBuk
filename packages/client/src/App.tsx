import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter, useHistory } from "react-router-dom";
import { getAuth } from "@firebase/auth";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";

import { store } from "@/store";

import AppContent from "@/AppContent";

import { Modal } from "@/features/modal/components";

import useConnectAuthToStore from "@/react-redux-firebase-auth/hooks/useConnectAuthToStore";

import { currentTheme } from "@/themes";
import { NotificationsProvider } from "./features/notifications/context";

import { closeAllModals } from "./features/modal/actions";

const App: React.FC = () => {
  // connect auth to store to recieve firebase SDK's auth updates
  // through redux store
  useConnectAuthToStore(getAuth(), store);
  const history = useHistory();

  // Subscribe to history changes and dispatch close modal action
  // to close any open modal when navigating away from the page
  React.useEffect(() => {
    const unlisten = history.listen(() => {
      store.dispatch(closeAllModals);
    });
    return () => unlisten();
  }, [history]);

  return (
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
  );
};

/**
 * An additional wrapper component, wrapping the app in a browser
 * router to make the router context available at top level.
 */
const RouterWrapped = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default RouterWrapped;
