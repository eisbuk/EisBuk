import React, { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSnackbar } from "notistack";

import { LocalStore, Notification } from "@/types/store";

import { removeSnackbar } from "@/store/actions/appActions";

/** @TODO refactor to use imported selector */
const selectNotifications = (store: LocalStore) =>
  store.app.notifications || [];

/** @TODO this should be a hook */
const Notifier: React.FC = () => {
  const dispatch = useDispatch();

  const notifications = useSelector(selectNotifications);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // stores the ids of dispalayed notifications
  const displayed = useRef<Notification["key"][]>([]);
  /**
   * Add notification key to displayed notifications
   * @param key of the notification
   */
  const storeDisplayed = (key: Notification["key"]) => {
    displayed.current = [...displayed.current, key];
  };

  /**
   * Remove the key of the notification from the displayed notifications
   * @param key of the notification
   */
  const removeDisplayed = (key: Notification["key"]) => {
    displayed.current = displayed.current.filter(
      (displayedKey) => key !== displayedKey
    );
  };

  useEffect(() => {
    notifications.forEach(
      ({ key, message, options = {}, dismissed = false }) => {
        if (dismissed) {
          // dismiss snackbar using notistack
          closeSnackbar(key);
          return;
        }

        // do nothing if snackbar is already displayed
        if (displayed.current.includes(key)) return;

        // display snackbar using notistack
        enqueueSnackbar(message, {
          key,
          ...options,
          onClose: (event, reason, myKey) => {
            if (options.onClose) {
              options.onClose(event, reason, myKey);
            }
          },
          onExited: (event, myKey) => {
            // remove this snackbar from redux store
            dispatch(removeSnackbar(myKey));
            removeDisplayed(myKey);
          },
        });

        // keep track of snackbars that we've displayed
        storeDisplayed(key);
      }
    );
  }, [notifications, closeSnackbar, enqueueSnackbar, dispatch]);

  return null;
};

export default Notifier;
