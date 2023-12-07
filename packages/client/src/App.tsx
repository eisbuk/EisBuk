import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter, useHistory } from "react-router-dom";
import { getAuth } from "@firebase/auth";

import { __isDev__ } from "./lib/constants";

import { store } from "@/store";

import AppContent from "@/AppContent";

import { Modal } from "@/features/modal/components";
import { NotificationsProvider } from "./features/notifications/context";
import { closeAllModals } from "./features/modal/actions";

import useConnectAuthToStore from "@/react-redux-firebase-auth/hooks/useConnectAuthToStore";

import { initDev } from "./lib/dev";

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

  React.useEffect(() => {
    if (__isDev__) {
      window["initDev"] = initDev;
    }
  }, []);

  return (
    <ReduxProvider store={store}>
      <NotificationsProvider timeouts={{ minTimeout: 1200, maxTimeout: 2000 }}>
        <AppContent />
        <Modal />
      </NotificationsProvider>
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
