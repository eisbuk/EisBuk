import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter, useHistory } from "react-router-dom";
import { getAuth } from "@firebase/auth";
import { doc, getDocFromCache } from "@firebase/firestore";

import { Collection } from "@eisbuk/shared";

import { __isDev__ } from "./lib/constants";

import { store } from "@/store";
import { db } from "@/setup";

import AppContent from "@/AppContent";

import { Modal } from "@/features/modal/components";
import { NotificationsProvider } from "./features/notifications/context";
import { closeAllModals } from "./features/modal/actions";
import { enqueueNotification } from "./features/notifications/actions";

import { NotifVariant } from "./enums/store";

import useConnectAuthToStore from "@/react-redux-firebase-auth/hooks/useConnectAuthToStore";

import { initDev } from "./lib/dev";
import { getOrganization } from "./lib/getters";
import { watchStorageHealth } from "./lib/storageRecovery";

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

  // Check the browser storage when the user comes back to the page,
  // and reload the page if it broke while the page was in the background
  React.useEffect(
    () =>
      watchStorageHealth({
        // A read from the local cache only: it goes through the same storage the writes use
        probe: () =>
          getDocFromCache(doc(db, Collection.Organizations, getOrganization())),
        notify: (message) =>
          store.dispatch(
            enqueueNotification({ message, variant: NotifVariant.Error })
          ),
      }),
    []
  );

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
