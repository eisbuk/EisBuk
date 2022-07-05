import { useContext } from "react";

import { NotificationsContext } from "./context";

/**
 * Subscribes to a NotificationsContext and returns the context value:
 * `activeNotification` and `handleRemoveNotification`
 */
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }

  return context;
};
