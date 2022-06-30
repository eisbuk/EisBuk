import * as React from "react";
import { useEffect, useRef, createContext, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  nextNotification,
  evictNotification,
} from "@/store/actions/notificationsActions";
import { getActiveNotification } from "@/store/selectors/notifications";

import { NotificationInterface } from "@/types/store";

interface Timeouts {
  minTimeout?: number;
  maxTimeout?: number;
}
interface NotificationsContextValue {
  activeNotification: NotificationInterface | undefined;
  handleRemoveNotification: () => void;
}

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

export const NotificationsProvider: React.FC<{
  children: React.ReactNode;
  timeouts: Timeouts;
}> = ({ children, timeouts: { minTimeout, maxTimeout } }) => {
  const dispatch = useDispatch();
  const activeNotification = useSelector(getActiveNotification);

  const afterMinTimeout = useRef<NodeJS.Timeout | null>(null);
  const afterMaxTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleRemoveNotification = () => {
    dispatch(evictNotification());
  };

  useEffect(() => {
    afterMinTimeout.current = setTimeout(() => {
      dispatch(nextNotification());
    }, minTimeout);

    afterMaxTimeout.current = setTimeout(() => {
      dispatch(evictNotification());
    }, maxTimeout);

    return () => {
      afterMinTimeout.current && clearTimeout(afterMinTimeout.current);
      afterMaxTimeout.current && clearTimeout(afterMaxTimeout.current);
    };
  }, [activeNotification]);

  return (
    <NotificationsContext.Provider
      value={{ activeNotification, handleRemoveNotification }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }

  return context;
};
